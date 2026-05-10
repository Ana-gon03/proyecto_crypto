-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema vivienda_upalm
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `vivienda_upalm` DEFAULT CHARACTER SET utf8mb4;
USE `vivienda_upalm`;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`CP`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`CP` (
  `idCP` INT NOT NULL AUTO_INCREMENT,
  `d_codigo` VARCHAR(5) NULL,
  `d_asenta` VARCHAR(100) NULL,
  `d_tipo_asenta` VARCHAR(50) NULL,
  `D_mnpio` VARCHAR(100) NULL,
  `d_estado` VARCHAR(60) NULL,
  `d_ciudad` VARCHAR(60) NULL,
  `d_CP` VARCHAR(5) NULL,
  `c_estado` VARCHAR(2) NULL,
  `c_oficina` VARCHAR(5) NULL,
  `c_CP` VARCHAR(5) NULL,
  `c_tipo_asenta` VARCHAR(2) NULL,
  `c_mnpio` VARCHAR(3) NULL,
  `id_asenta_cpcons` VARCHAR(4) NULL,
  `d_zona` VARCHAR(10) NULL,
  `c_cve_ciudad` VARCHAR(2) NULL,
  `cpAceptadoSistema` BINARY NULL DEFAULT 0,
  PRIMARY KEY (`idCP`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`direccion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`direccion` (
  `idDireccion` INT NOT NULL AUTO_INCREMENT,
  `direccionCalle` VARCHAR(150) NOT NULL,
  `direccionNumExt` VARCHAR(20) NOT NULL,
  `direccionNumInt` VARCHAR(20) NULL DEFAULT NULL,
  `CP_idCP` INT NOT NULL,
  PRIMARY KEY (`idDireccion`),
  INDEX `fk_direccion_CP1_idx` (`CP_idCP` ASC) VISIBLE,
  CONSTRAINT `fk_direccion_CP1`
    FOREIGN KEY (`CP_idCP`)
    REFERENCES `vivienda_upalm`.`CP` (`idCP`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`usuario` (
  `idUsuario` INT NOT NULL AUTO_INCREMENT,
  `usuarioNom` VARCHAR(60) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `usuarioApePat` VARCHAR(35) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `usuarioApeMat` VARCHAR(35) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `usuarioCorreo` VARCHAR(60) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `usuarioTel` CHAR(13) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `usuarioCurp` CHAR(18) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `usuarioContra` VARCHAR(200) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `usuarioFechaNac` DATE NULL DEFAULT NULL,
  `usuarioFechaRegis` DATETIME NULL DEFAULT NULL,
  `usuarioFechaUIS` DATETIME NULL DEFAULT NULL,
  `usuarioCodigo` CHAR(8) NULL,
  `usuarioCorreoVerificado` TINYINT NULL DEFAULT 0,
  `usuarioCodigoFecha` DATETIME NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE INDEX `usuarioCorreo` (`usuarioCorreo` ASC) VISIBLE,
  UNIQUE INDEX `usuarioCurp` (`usuarioCurp` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`unidad_academica`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`unidad_academica` (
  `idUnidadAcademica` INT NOT NULL AUTO_INCREMENT,
  `unidadAcademicaNombre` VARCHAR(150) NOT NULL,
  `unidadAcademicaClave` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`idUnidadAcademica`),
  UNIQUE INDEX `unidadAcademicaClave` (`unidadAcademicaClave` ASC) VISIBLE,
  UNIQUE INDEX `unidadAcademicaNombre` (`unidadAcademicaNombre` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`carrera`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`carrera` (
  `idCarrera` INT NOT NULL AUTO_INCREMENT,
  `carreraNombre` VARCHAR(150) NOT NULL,
  `carreraClave` VARCHAR(10) NOT NULL,
  `idUnidadAcademica` INT NOT NULL,
  PRIMARY KEY (`idCarrera`),
  UNIQUE INDEX `carreraClave` (`carreraClave` ASC) VISIBLE,
  UNIQUE INDEX `carreraNombre` (`carreraNombre` ASC) VISIBLE,
  INDEX `fk_carrera_unidad_academica` (`idUnidadAcademica` ASC) VISIBLE,
  CONSTRAINT `fk_carrera_unidad_academica`
    FOREIGN KEY (`idUnidadAcademica`)
    REFERENCES `vivienda_upalm`.`unidad_academica` (`idUnidadAcademica`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`arrendatario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`arrendatario` (
  `idArrendatario` INT NOT NULL AUTO_INCREMENT,
  `arrendatarioBoleta` VARCHAR(12) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `arrendatarioVerificado` TINYINT NULL DEFAULT 0,
  `arrendatarioFechaVerificación` DATETIME NULL,
  `arrendatarioUser` VARCHAR(50) NULL DEFAULT NULL,
  `usuario_idUsuario` INT NOT NULL,
  `carrera_idCarrera` INT NOT NULL,
  PRIMARY KEY (`idArrendatario`),
  INDEX `fk_arrendatario_usuario1_idx` (`usuario_idUsuario` ASC) VISIBLE,
  INDEX `fk_arrendatario_carrera1_idx` (`carrera_idCarrera` ASC) VISIBLE,
  CONSTRAINT `fk_arrendatario_carrera1`
    FOREIGN KEY (`carrera_idCarrera`)
    REFERENCES `vivienda_upalm`.`carrera` (`idCarrera`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_arrendatario_usuario1`
    FOREIGN KEY (`usuario_idUsuario`)
    REFERENCES `vivienda_upalm`.`usuario` (`idUsuario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`arrendador`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`arrendador` (
  `idArrendador` INT NOT NULL AUTO_INCREMENT,
  `arrendadorRFC` CHAR(14) NULL DEFAULT NULL,
  `usuario_idUsuario` INT NOT NULL,
  `direccion_idDireccion` INT NOT NULL,
  PRIMARY KEY (`idArrendador`),
  INDEX `fk_arrendador_usuario1_idx` (`usuario_idUsuario` ASC) VISIBLE,
  INDEX `fk_arrendador_direccion1_idx` (`direccion_idDireccion` ASC) VISIBLE,
  CONSTRAINT `fk_arrendador_direccion1`
    FOREIGN KEY (`direccion_idDireccion`)
    REFERENCES `vivienda_upalm`.`direccion` (`idDireccion`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_arrendador_usuario1`
    FOREIGN KEY (`usuario_idUsuario`)
    REFERENCES `vivienda_upalm`.`usuario` (`idUsuario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`propiedad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`propiedad` (
  `idPropiedad` INT NOT NULL AUTO_INCREMENT,
  `propiedadTitulo` VARCHAR(45) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `propiedadDescripcion` VARCHAR(300) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `propiedadTipo` VARCHAR(45) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `propiedadLugares` INT NOT NULL,
  `propiedadPrecio` DECIMAL(10,2) NOT NULL,
  `propiedadEstatus` ENUM('Disponible', 'Sin Disponibilidad', 'Desactivada') CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT 'Disponible',
  `propiedadFechaRegis` DATETIME NOT NULL,
  `direccion_idDireccion` INT NOT NULL,
  `arrendador_idArrendador` INT NOT NULL,
  PRIMARY KEY (`idPropiedad`),
  INDEX `fk_propiedad_direccion1_idx` (`direccion_idDireccion` ASC) VISIBLE,
  INDEX `fk_propiedad_arrendador1_idx` (`arrendador_idArrendador` ASC) VISIBLE,
  CONSTRAINT `fk_propiedad_direccion1`
    FOREIGN KEY (`direccion_idDireccion`)
    REFERENCES `vivienda_upalm`.`direccion` (`idDireccion`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_propiedad_arrendador1`
    FOREIGN KEY (`arrendador_idArrendador`)
    REFERENCES `vivienda_upalm`.`arrendador` (`idArrendador`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `vivienda_upalm`.`administrador`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`administrador` (
  `idAdmin` INT NOT NULL AUTO_INCREMENT,
  `adminUser` VARCHAR(45) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `adminContra` VARCHAR(200) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `adminFechaInicioSesion` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`idAdmin`),
  UNIQUE INDEX `administradorUser` (`adminUser` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`arrendamiento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`arrendamiento` (
  `idArrendamiento` INT NOT NULL AUTO_INCREMENT,
  `arrendamientoFechaInicio` DATETIME NULL DEFAULT NULL,
  `arrendamientoRenta` FLOAT NULL DEFAULT NULL,
  `arrendamientoDescrip` VARCHAR(300) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NULL DEFAULT NULL,
  `arrendamientoValEstudiante` TINYINT NULL DEFAULT 0,
  `arrendamientoValArrendador` TINYINT NULL DEFAULT 0,
  `arrendatario_idArrendatario` INT NOT NULL,
  `propiedad_idPropiedad` INT NOT NULL,
  PRIMARY KEY (`idArrendamiento`),
  INDEX `fk_arrendamiento_arrendatario1_idx` (`arrendatario_idArrendatario` ASC) VISIBLE,
  INDEX `fk_arrendamiento_propiedad1_idx` (`propiedad_idPropiedad` ASC) VISIBLE,
  CONSTRAINT `fk_arrendamiento_arrendatario1`
    FOREIGN KEY (`arrendatario_idArrendatario`)
    REFERENCES `vivienda_upalm`.`arrendatario` (`idArrendatario`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_arrendamiento_propiedad1`
    FOREIGN KEY (`propiedad_idPropiedad`)
    REFERENCES `vivienda_upalm`.`propiedad` (`idPropiedad`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`fotos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`fotos` (
  `idFotos` INT NOT NULL AUTO_INCREMENT,
  `fotosURL` VARCHAR(500) NULL DEFAULT NULL,
  `propiedad_idPropiedad` INT NOT NULL,
  PRIMARY KEY (`idFotos`),
  INDEX `fk_fotos_propiedad_idx` (`propiedad_idPropiedad` ASC) VISIBLE,
  CONSTRAINT `fk_fotos_propiedad`
    FOREIGN KEY (`propiedad_idPropiedad`)
    REFERENCES `vivienda_upalm`.`propiedad` (`idPropiedad`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`resena`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`resena` (
  `idResena` INT NOT NULL AUTO_INCREMENT,
  `resenaFechaCreacion` DATETIME NULL DEFAULT NULL,
  `resenaDuracionRenta` INT NULL DEFAULT NULL,
  `resenaDescrip` VARCHAR(300) CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `resenaCalSerBasic` DECIMAL(2,1) NULL,
  `resenaCalSerComEnt` DECIMAL(2,1) NULL,
  `resenaCalSerAdicio` DECIMAL(2,1) NULL,
  `resenaCalGen` DECIMAL(2,1) NOT NULL,
  `resenaSentimiento` VARCHAR(45) NULL DEFAULT NULL,
  `propiedad_idPropiedad` INT NOT NULL,
  `arrendatario_idArrendatario` INT NOT NULL,
  PRIMARY KEY (`idResena`),
  INDEX `fk_resena_propiedad1_idx` (`propiedad_idPropiedad` ASC) VISIBLE,
  INDEX `fk_resena_arrendatario1_idx` (`arrendatario_idArrendatario` ASC) VISIBLE,
  CONSTRAINT `fk_resena_arrendatario1`
    FOREIGN KEY (`arrendatario_idArrendatario`)
    REFERENCES `vivienda_upalm`.`arrendatario` (`idArrendatario`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_resena_propiedad1`
    FOREIGN KEY (`propiedad_idPropiedad`)
    REFERENCES `vivienda_upalm`.`propiedad` (`idPropiedad`)
    ON DELETE RESTRICT)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`servicio`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`servicio` (
  `idServicio` INT NOT NULL AUTO_INCREMENT,
  `servicioNombre` VARCHAR(100) NOT NULL,
  `servicioCategoria` ENUM('Basico', 'Entretenimiento', 'Adicional') NOT NULL,
  PRIMARY KEY (`idServicio`),
  UNIQUE INDEX `servicioNombre` (`servicioNombre` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `vivienda_upalm`.`servicio_has_propiedad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vivienda_upalm`.`servicio_has_propiedad` (
  `servicio_idServicio` INT NOT NULL,
  `propiedad_idPropiedad` INT NOT NULL,
  PRIMARY KEY (`servicio_idServicio`, `propiedad_idPropiedad`),
  INDEX `fk_servicio_has_propiedad_propiedad1_idx` (`propiedad_idPropiedad` ASC) VISIBLE,
  INDEX `fk_servicio_has_propiedad_servicio1_idx` (`servicio_idServicio` ASC) VISIBLE,
  CONSTRAINT `fk_servicio_has_propiedad_propiedad1`
    FOREIGN KEY (`propiedad_idPropiedad`)
    REFERENCES `vivienda_upalm`.`propiedad` (`idPropiedad`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_servicio_has_propiedad_servicio1`
    FOREIGN KEY (`servicio_idServicio`)
    REFERENCES `vivienda_upalm`.`servicio` (`idServicio`)
    ON DELETE RESTRICT)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;