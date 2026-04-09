-- ========================================================
-- MIGRACIÓN: SISTEMA DE AUDITORÍA DE MOVIMIENTOS
-- ========================================================
-- ⚠️ Ejecutar este script en el SQL EDITOR de Supabase
-- Requiere privilegios de Superuser / Admin

-- 1. Crear la tabla de Auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para búsquedas rápidas en el Frontend
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_id ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);

-- 2. Habilitar la seguridad RLS (Role Level Security)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo Administradores pueden leer la auditoría
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        ) 
        OR auth.jwt() ->> 'email' = 'eliaslongstaff@gmail.com'
    );

-- Absolutamente nadie puede alterar la auditoría
CREATE POLICY "No one can insert/update/delete audit logs directly"
    ON public.audit_logs
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- 3. Crear la Función Disparadora (Trigger Function)
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Intentar capturar el ID del usuario directamente del JWT logueado
    current_user_id := auth.uid();
    
    -- Si auth.uid() está vacío pero la tabla tracking_trips tiene un 'created_by' explícito (ej: en INSERT)
    IF current_user_id IS NULL AND TG_TABLE_NAME = 'tracking_trips' THEN
        IF TG_OP = 'INSERT' AND NEW.created_by IS NOT NULL THEN
            BEGIN
                current_user_id := NEW.created_by::UUID;
            EXCEPTION WHEN OTHERS THEN
                -- Ignore cast errors
            END;
        ELSIF TG_OP = 'UPDATE' AND NEW.created_by IS NOT NULL THEN
            BEGIN
                current_user_id := NEW.created_by::UUID;
            EXCEPTION WHEN OTHERS THEN
                -- Ignore cast errors
            END;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, to_jsonb(NEW), current_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo registrar si hubo cambios reales (ignorar updates vacíos)
        IF OLD IS DISTINCT FROM NEW THEN
            INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
            VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, to_jsonb(OLD), to_jsonb(NEW), current_user_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, user_id)
        VALUES (TG_TABLE_NAME, OLD.id::text, TG_OP, to_jsonb(OLD), current_user_id);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Anclar el Trigger a la tabla tracking_trips
DROP TRIGGER IF EXISTS audit_tracking_trips_trigger ON public.tracking_trips;
CREATE TRIGGER audit_tracking_trips_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tracking_trips
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
