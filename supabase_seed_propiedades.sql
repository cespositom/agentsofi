-- ═══════════════════════════════════════════════════════════════
-- 50 propiedades de prueba — Región Metropolitana de Chile
-- Mezcla: Venta (UF) + Arriendo (CLP) en distintas comunas y tipos
-- Ejecutar en SQL Editor o vía psql después de supabase_schema.sql
-- ═══════════════════════════════════════════════════════════════

insert into public.propiedades
  (nombre, tipo, operacion, precio, comuna, dormitorios, banos, m2, amenidades, direccion, disponible)
values
  -- ─── Venta (precios en UF) ─────────────────────────────────────
  ('Edificio Mirador Las Condes',     'Departamento',   'Venta',    8500,  'Las Condes',       3, 2, 105, ARRAY['piscina','gimnasio','quincho','conserjería 24h'],          'Av. Apoquindo 4500',           true),
  ('Penthouse Costanera Vitacura',    'Departamento',   'Venta',   18500,  'Vitacura',         4, 4, 220, ARRAY['terraza','jacuzzi','vista panorámica','bodega','2 estac.'], 'Av. Vitacura 3201',            true),
  ('Casa Mediterránea Lo Barnechea',  'Casa',           'Venta',   22000,  'Lo Barnechea',     5, 4, 380, ARRAY['piscina','jardín','quincho','seguridad'],                  'El Arrayán 2150',              true),
  ('Depto Boutique Providencia',      'Departamento',   'Venta',    5400,  'Providencia',      2, 2,  72, ARRAY['gimnasio','terraza','bodega'],                              'Av. Providencia 1850',         true),
  ('Loft Parque Bustamante',          'Departamento',   'Venta',    3950,  'Providencia',      1, 1,  48, ARRAY['gym','sala multiuso'],                                      'General Bustamante 220',       true),
  ('Casa Familiar Ñuñoa',             'Casa',           'Venta',    9800,  'Ñuñoa',            4, 3, 240, ARRAY['jardín','estacionamiento','bodega'],                       'Av. Irarrázaval 4480',         true),
  ('Departamento Plaza Ñuñoa',        'Departamento',   'Venta',    4700,  'Ñuñoa',            2, 1,  62, ARRAY['quincho','piscina'],                                        'Jorge Washington 360',         true),
  ('Casa La Reina Premium',           'Casa',           'Venta',   13500,  'La Reina',         4, 3, 280, ARRAY['piscina','jardín','bodega','seguridad'],                   'Av. Larraín 7800',             true),
  ('Departamento Lastarria',          'Departamento',   'Venta',    3200,  'Santiago Centro',  1, 1,  45, ARRAY['conserjería','gym'],                                        'Calle Lastarria 70',           true),
  ('Studio Plaza de Armas',           'Departamento',   'Venta',    2400,  'Santiago Centro',  1, 1,  35, ARRAY['conserjería 24h'],                                          'Compañía 1234',                true),
  ('Casa Terra Sur Huechuraba',       'Casa',           'Venta',    7900,  'Huechuraba',       4, 3, 200, ARRAY['quincho','jardín','seguridad'],                            'Avda. del Valle 1200',         true),
  ('Departamento Las Perdices',       'Departamento',   'Venta',    4100,  'Peñalolén',        3, 2,  85, ARRAY['quincho','piscina','sala multiuso'],                       'Las Perdices 5500',            true),
  ('Casa La Florida Familiar',        'Casa',           'Venta',    5600,  'La Florida',       4, 2, 180, ARRAY['jardín','quincho'],                                         'Walker Martínez 1450',         true),
  ('Departamento Plaza Maipú',        'Departamento',   'Venta',    3300,  'Maipú',            3, 2,  78, ARRAY['gym','quincho','sala de juegos'],                          'Av. Pajaritos 2100',           true),
  ('Casa San Miguel Reformada',       'Casa',           'Venta',    4800,  'San Miguel',       3, 2, 150, ARRAY['patio','bodega'],                                           'Gran Avenida 5400',            true),
  ('Departamento Macul Central',      'Departamento',   'Venta',    3700,  'Macul',            2, 2,  65, ARRAY['quincho','sala multiuso'],                                  'Av. Macul 3300',               true),
  ('Casa Estación Central',           'Casa',           'Venta',    4200,  'Estación Central', 3, 2, 140, ARRAY['patio','estacionamiento'],                                  'Avda. Las Rejas Sur 280',      true),
  ('Departamento Recoleta Heritage',  'Departamento',   'Venta',    3100,  'Recoleta',         2, 1,  58, ARRAY['conserjería','bodega'],                                     'Recoleta 1480',                true),
  ('Casa San Joaquín',                'Casa',           'Venta',    3950,  'San Joaquín',      3, 2, 130, ARRAY['patio'],                                                    'Carlos Valdovinos 950',        true),
  ('Departamento San Bernardo',       'Departamento',   'Venta',    2800,  'San Bernardo',     2, 1,  60, ARRAY['quincho'],                                                  'Eyzaguirre 540',               true),
  ('Casa Puente Alto',                'Casa',           'Venta',    3450,  'Puente Alto',      3, 2, 110, ARRAY['patio','bodega'],                                           'Av. Concha y Toro 1840',       true),
  ('Departamento Quilicura',          'Departamento',   'Venta',    2950,  'Quilicura',        2, 1,  55, ARRAY['gym','sala multiuso'],                                      'O''Higgins 1290',              true),
  ('Casa Pudahuel Sur',               'Casa',           'Venta',    3200,  'Pudahuel',         3, 2, 120, ARRAY['patio'],                                                    'Av. La Estrella 980',          true),
  ('Loft Independencia',              'Departamento',   'Venta',    2700,  'Independencia',    1, 1,  42, ARRAY['gym'],                                                       'Av. Independencia 760',        true),
  ('Departamento Conchalí',           'Departamento',   'Venta',    2850,  'Conchalí',         2, 1,  56, ARRAY['quincho'],                                                   'Av. Independencia 5800',       true),
  ('Parcela El Romeral Lo Barnechea','Parcela',        'Venta',   12000,  'Lo Barnechea',     0, 0,5000, ARRAY['agua','luz','vista cordillera'],                            'Camino El Romeral s/n',        true),
  ('Parcela Pirque',                  'Parcela',        'Venta',    8500,  'Puente Alto',      0, 0,5000, ARRAY['pozo','árboles frutales'],                                  'Camino Pirque km 3',           true),
  ('Terreno Industrial Renca',        'Terreno',        'Venta',    6800,  'Renca',            0, 0,1200, ARRAY['acceso camión'],                                            'Av. Walker Martínez 1500',     true),
  ('Oficina Apoquindo Premium',       'Oficina',        'Venta',    5200,  'Las Condes',       0, 1,  85, ARRAY['recepción','sala reuniones','data center'],                'Apoquindo 5100 piso 12',       true),
  ('Local Comercial Ñuñoa',           'Local Comercial','Venta',    3400,  'Ñuñoa',            0, 1,  65, ARRAY['vitrina','depósito'],                                       'Av. Irarrázaval 3200',         true),

  -- ─── Arriendo (precios en CLP/mes) ─────────────────────────────
  ('Departamento Costanera Center',   'Departamento',   'Arriendo', 1450000, 'Providencia',      2, 2,  80, ARRAY['piscina','gym','vista río','bodega'],                     'Andrés Bello 2425',            true),
  ('Studio Bellavista',               'Departamento',   'Arriendo',  650000, 'Recoleta',         1, 1,  38, ARRAY['gym','terraza'],                                           'Pío Nono 220',                 true),
  ('Departamento Las Condes Familiar','Departamento',   'Arriendo', 1200000, 'Las Condes',       3, 2, 110, ARRAY['piscina','quincho','2 estac.'],                           'Cerro El Plomo 5630',          true),
  ('Casa Vitacura Amoblada',          'Casa',           'Arriendo', 3500000, 'Vitacura',         4, 4, 320, ARRAY['piscina','jardín','quincho','amoblada'],                  'Alonso de Córdova 3850',       true),
  ('Departamento Lo Barnechea',       'Departamento',   'Arriendo', 1100000, 'Lo Barnechea',     2, 2,  75, ARRAY['quincho','sala multiuso','piscina'],                      'Avda. La Dehesa 2120',         true),
  ('Departamento Ñuñoa Plaza',        'Departamento',   'Arriendo',  720000, 'Ñuñoa',            2, 1,  62, ARRAY['quincho','sala multiuso'],                                'Jorge Washington 358',         true),
  ('Casa La Reina',                   'Casa',           'Arriendo', 1800000, 'La Reina',         3, 2, 200, ARRAY['jardín','quincho','bodega'],                              'Av. Príncipe de Gales 6700',   true),
  ('Loft Lastarria',                  'Departamento',   'Arriendo',  580000, 'Santiago Centro',  1, 1,  42, ARRAY['conserjería 24h','gym'],                                  'Calle Merced 480',             true),
  ('Departamento Brasil',             'Departamento',   'Arriendo',  450000, 'Santiago Centro',  1, 1,  40, ARRAY['conserjería'],                                            'Compañía 2150',                true),
  ('Departamento Huechuraba',         'Departamento',   'Arriendo',  680000, 'Huechuraba',       2, 1,  58, ARRAY['quincho','piscina'],                                      'Avda. del Valle 1300',         true),
  ('Casa Peñalolén Familiar',         'Casa',           'Arriendo', 1350000, 'Peñalolén',        4, 3, 180, ARRAY['jardín','quincho','seguridad'],                           'Av. Las Perdices 5780',        true),
  ('Departamento La Florida',         'Departamento',   'Arriendo',  520000, 'La Florida',       2, 1,  60, ARRAY['gym','sala multiuso'],                                    'Vicuña Mackenna 7100',         true),
  ('Departamento Maipú',              'Departamento',   'Arriendo',  480000, 'Maipú',            2, 1,  55, ARRAY['quincho','piscina'],                                      'Av. Pajaritos 2300',           true),
  ('Departamento San Miguel',         'Departamento',   'Arriendo',  490000, 'San Miguel',       2, 1,  58, ARRAY['gym','quincho'],                                          'Gran Avenida 5300',            true),
  ('Departamento Quinta Normal',      'Departamento',   'Arriendo',  430000, 'Quinta Normal',    2, 1,  52, ARRAY['conserjería'],                                            'Av. Matucana 800',             true),
  ('Casa Cerrillos',                  'Casa',           'Arriendo',  890000, 'Cerrillos',        3, 2, 130, ARRAY['patio','bodega'],                                         'Av. Departamental 1450',       true),
  ('Departamento Lo Prado',           'Departamento',   'Arriendo',  420000, 'Lo Prado',         2, 1,  50, ARRAY['quincho'],                                                'San Pablo 5650',               true),
  ('Departamento Pedro Aguirre Cerda','Departamento',   'Arriendo',  410000, 'Pedro Aguirre Cerda', 2, 1, 48, ARRAY['conserjería'],                                          'Av. Departamental 700',        true),
  ('Oficina Los Leones',              'Oficina',        'Arriendo',  950000, 'Providencia',      0, 1,  72, ARRAY['recepción','sala reuniones','kitchenette'],               'Av. Apoquindo 3550 piso 8',    true),
  ('Local Comercial Las Condes',      'Local Comercial','Arriendo', 2200000, 'Las Condes',       0, 1, 110, ARRAY['vitrina','bodega','aire acondicionado'],                  'Apoquindo 6700 local 5',       true),
  ('Bodega Quilicura',                'Bodega',         'Arriendo',  680000, 'Quilicura',        0, 1, 250, ARRAY['acceso camión','seguridad'],                              'Camino a Lampa 950',           true);

select count(*) as total_propiedades from public.propiedades;
select 'OK: 50 propiedades insertadas' as resultado;
