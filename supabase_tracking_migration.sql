-- ========================================================
-- MIGRACIÓN: AGREGAR COLUMNAS PARA TRACKING
-- ========================================================
-- Ejecutar este script en el SQL EDITOR de Supabase para
-- evitar el error "Could not find column 'retira'".

-- 1. Agregar columna 'retira'
ALTER TABLE public.tracking_trips 
ADD COLUMN IF NOT EXISTS retira TEXT;

-- 2. Asegurar que 'vehicle_plate' existe (para B2C que ahora la requiere)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tracking_trips' AND column_name='vehicle_plate') THEN
        ALTER TABLE public.tracking_trips ADD COLUMN vehicle_plate TEXT;
    END IF;
END $$;

-- 3. Comentario de verificación (Opcional)
COMMENT ON COLUMN public.tracking_trips.retira IS 'Nombre de quien retira o transporte secundario';
COMMENT ON COLUMN public.tracking_trips.vehicle_plate IS 'Patente o Dominio del vehículo';
