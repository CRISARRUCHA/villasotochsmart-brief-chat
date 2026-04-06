ALTER TABLE public.projects 
  ADD COLUMN completion_title text DEFAULT '¡Brief completado! 🎉',
  ADD COLUMN completion_subtitle text DEFAULT 'Ya tenemos toda la información que necesitamos para diseñar tu sitio web. Nuestro equipo se pondrá en contacto contigo muy pronto para los siguientes pasos.',
  ADD COLUMN completion_next_label text DEFAULT '¿Qué sigue?',
  ADD COLUMN completion_next_text text DEFAULT 'Revisaremos tu brief, prepararemos una propuesta personalizada y te contactaremos para alinear detalles.',
  ADD COLUMN completion_link_url text DEFAULT 'https://creatulanding.com',
  ADD COLUMN completion_link_text text DEFAULT 'Visita creatulanding.com →';