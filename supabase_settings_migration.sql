-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Turn on RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to system_settings"
    ON public.system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Allow admin full access to system_settings"
    ON public.system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert some default mock values for the General Settings panel
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('default_sla_hours', '48', 'Tiempo máximo en horas para procesar viajes antes de marcarlos como atrasados.'),
    ('allowed_transports', '["TTE VILLA DEL SUR", "SCORPIO EXPRESS", "LOGISTICA ANDINA", "FLETES RAPIDOS S.A.", "OCASA PROPIO"]', 'Lista de agencias de transporte permitidas en los selectores.'),
    ('system_maintenance_mode', 'false', 'Si es true, muestra un banner de mantenimiento a los operativos.')
ON CONFLICT (key) DO NOTHING;
