Hi hi ! ! !

Instrucciones para cargar el schema de la base de datos y los datos de prueba.

Archivos los buenos y definitivos:
 - db_vivienda_upalm_schema.sql (scrpit para crear base de datos)
 - db_vivienda_upalm_schema.mwb (diagrama ER de la base de datos)
 - db_vivienda_upalm_datos.sql (cargra de datos de prueba)
 - CatalogoCodigosPostales.txt

Todos los demas archivos que estan en la carpeta son las versiones anteriores de la base de datos.

1. Debemos de crear la base de datos 'dbBurroomies' con el script de db_vivienda_upalm_schema.sql

2. Una vez creada la base de datos el primer catalogo que vamos a necesitar cargar en la base es el de los codigos postales. Necesitan abrir una terminal (Windows + R y despues cmd). Una vez abierto van a ejecutar estos comandos:

mysql -u root -p dbBurroomies


-- La ruta del INFILE necesitan cambiarla para donde esta ubicado su archivo del catalogo del los CP
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/CatalogoCodigosPostales.txt'
INTO TABLE `dbBurroomies`.`CP`
CHARACTER SET latin1
FIELDS TERMINATED BY '|'
ENCLOSED BY ''
LINES TERMINATED BY '\n'
(d_codigo, d_asenta, d_tipo_asenta, D_mnpio, d_estado, d_ciudad,
 d_CP, c_estado, c_oficina, c_CP, c_tipo_asenta, c_mnpio, id_asenta_cpcons,
 d_zona, c_cve_ciudad)
SET cpAceptadoSistema = 0;


3. Una vez cargado el catalogo pocedemos a ejecutar el otro script de db_vivienda_upalm_datos.sql

4. Si quieren volver a cargar los datos usen el archivo de scriptBorrarContenidosTablasDB.txt para borrar el contendio de las tablas (ese script no borra el catalogo de codigos postales).