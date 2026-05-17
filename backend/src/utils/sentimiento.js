// backend/src/utils/sentimiento.js
// Clasificador Naive Bayes entrenado con 210 ejemplos
// Incluye manejo de negaciones, casos mixtos, sarcasmo y ambigüedades

//FUNCIONAMIENTO:
// Implementa un clasificador de sentimiento basado en reglas para analizar la opinión expresada en textos relacionados con propiedades de alquiler.
// El clasificador utiliza un conjunto de datos de entrenamiento con ejemplos etiquetados como positivos o negativos. 
// Incluye manejo de negaciones (por ejemplo, "no está sucio" se interpreta como positivo), casos mixtos(donde hay aspectos positivos y negativos pero la conclusión final es positiva) y sarcasmo/ambigüedades (donde el texto puede parecer negativo pero la intención es positiva).

const DATOS = [

  // ════════════════════════════════════════════════════════════
  //POSITIVOS SIMPLES
  // ════════════════════════════════════════════════════════════
  { texto: 'precio justo por lo que ofrece lo recomiendo', clase: 'positivo' },
  { texto: 'me senti como en casa muy comodo y seguro', clase: 'positivo' },
  { texto: 'el edificio tiene camara y guardia me siento muy seguro', clase: 'positivo' },
  { texto: 'excelente relacion calidad precio recomendable para estudiantes', clase: 'positivo' },
  { texto: 'el lugar es muy tranquilo perfecto para concentrarse', clase: 'positivo' },
  { texto: 'el cuarto es espacioso iluminado y muy limpio', clase: 'positivo' },
  { texto: 'el dueno siempre disponible y muy atento', clase: 'positivo' },
  { texto: 'muy buen lugar para concentrarse y estudiar tranquilo', clase: 'positivo' },
  { texto: 'el arrendador es muy responsable y atento recomendable', clase: 'positivo' },
  { texto: 'instalaciones en perfecto estado recomendable', clase: 'positivo' },
  { texto: 'el dueno es muy comprensivo y flexible con los pagos excelente persona', clase: 'positivo' },
  { texto: 'el lugar es limpio seguro y bien mantenido volveria sin duda', clase: 'positivo' },
  { texto: 'el arrendador es muy responsable y atento lo recomiendo', clase: 'positivo' },
  { texto: 'la zona es muy segura nunca tuve ningun incidente', clase: 'positivo' },
  { texto: 'vecinos tranquilos y respetuosos buen ambiente', clase: 'positivo' },
  { texto: 'agua caliente las 24 horas excelente servicio', clase: 'positivo' },
  { texto: 'cocina bien equipada y en buen estado limpia', clase: 'positivo' },
  { texto: 'vecinos tranquilos ambiente agradable volveria sin duda', clase: 'positivo' },
  { texto: 'limpian las areas comunes regularmente siempre esta presentable', clase: 'positivo' },
  { texto: 'el lugar estaba impecable cuando llegue y lo mantienen muy limpio', clase: 'positivo' },
  { texto: 'bonita vista desde el cuarto muy tranquilo y comodo', clase: 'positivo' },
  { texto: 'vecinos tranquilos ambiente agradable recomendable', clase: 'positivo' },
  { texto: 'sin cucarachas sin plagas muy higienico y limpio', clase: 'positivo' },
  { texto: 'el dueno resuelve todo rapidamente volveria sin duda', clase: 'positivo' },
  { texto: 'muy limpio ordenado y bien cuidado recomendable', clase: 'positivo' },
  { texto: 'la lavanderia incluida es un plus excelente servicio', clase: 'positivo' },
  { texto: 'seguridad del edificio muy buena me siento tranquilo', clase: 'positivo' },
  { texto: 'precio justo calidad excelente volveria sin duda', clase: 'positivo' },
  { texto: 'instalaciones en perfecto estado sin ningun problema', clase: 'positivo' },
  { texto: 'excelente ubicacion con todos los servicios lo recomiendo', clase: 'positivo' },
  { texto: 'el dueno resuelve todo rapidamente recomendable', clase: 'positivo' },
  { texto: 'el dueno resuelve todo rapidamente lo recomiendo', clase: 'positivo' },
  { texto: 'nunca tuve problemas con el internet siempre estable y rapido', clase: 'positivo' },
  { texto: 'sin problemas de agua ni luz todo funciona lo recomiendo', clase: 'positivo' },
  { texto: 'precio justo calidad excelente lo recomiendo', clase: 'positivo' },
  { texto: 'excelente lugar muy limpio y seguro recomendable', clase: 'positivo' },
  { texto: 'el internet es de fibra optica super rapido perfecto para clases', clase: 'positivo' },
  { texto: 'la presion del agua es muy buena excelente servicio', clase: 'positivo' },
  { texto: 'el lugar es limpio seguro y bien mantenido recomendable', clase: 'positivo' },
  { texto: 'muy buena ubicacion cerca del ipn y del metro', clase: 'positivo' },
  { texto: 'excelente seguridad en el edificio acceso con tarjeta y vigilancia', clase: 'positivo' },
  { texto: 'me gusto mucho el ambiente del lugar muy agradable', clase: 'positivo' },
  { texto: 'la presion del agua es buena y nunca falla', clase: 'positivo' },
  { texto: 'precio justo calidad excelente recomendable', clase: 'positivo' },
  { texto: 'nunca tuve problemas con la luz siempre estable', clase: 'positivo' },
  { texto: 'sin problemas de agua ni luz todo funciona recomendable', clase: 'positivo' },
  { texto: 'el mejor precio que encontre en la zona con buena calidad', clase: 'positivo' },
  { texto: 'vale cada peso que cuesta muy buen lugar por el precio', clase: 'positivo' },
  { texto: 'el propietario es muy honesto cumple todo lo del contrato', clase: 'positivo' },
  { texto: 'nunca vi una cucaracha ni ningun bicho muy higienico', clase: 'positivo' },
  { texto: 'muy limpio ordenado y bien cuidado lo recomiendo', clase: 'positivo' },
  { texto: 'el internet es excelente ideal para estudiar en linea', clase: 'positivo' },
  { texto: 'el arrendador es muy responsable y atento volveria sin duda', clase: 'positivo' },
  { texto: 'el arrendador cumple todo lo que promete muy honesto', clase: 'positivo' },
  { texto: 'internet rapido y agua caliente siempre recomendable', clase: 'positivo' },
  { texto: 'lo recomiendo ampliamente a todos los estudiantes del ipn', clase: 'positivo' },
  { texto: 'completamente silencioso ideal para estudiar y descansar', clase: 'positivo' },
  { texto: 'los vecinos son muy considerados nunca hacen ruido', clase: 'positivo' },
  { texto: 'el arrendador es amable y resuelve problemas rapido', clase: 'positivo' },
  { texto: 'el internet incluido es excelente puedo hacer videoconferencias sin problemas', clase: 'positivo' },
  { texto: 'nada me falta aqui tiene todo lo necesario para vivir', clase: 'positivo' },
  { texto: 'sin problemas de agua ni luz todo funciona volveria sin duda', clase: 'positivo' },
  { texto: 'todo en perfecto estado desde que llegue sin quejas', clase: 'positivo' },
  { texto: 'el lugar es limpio seguro y bien mantenido lo recomiendo', clase: 'positivo' },
  { texto: 'excelente precio para todo lo que incluye muy buena oferta', clase: 'positivo' },
  { texto: 'instalaciones en perfecto estado volveria sin duda', clase: 'positivo' },
  { texto: 'internet rapido agua caliente todo funciona perfecto', clase: 'positivo' },
  { texto: 'excelente ubicacion con todos los servicios recomendable', clase: 'positivo' },
  { texto: 'internet rapido y agua caliente siempre volveria sin duda', clase: 'positivo' },
  { texto: 'muy limpio ordenado y bien cuidado volveria sin duda', clase: 'positivo' },
  { texto: 'nunca fallo el agua en todo el tiempo que vivi ahi', clase: 'positivo' },
  { texto: 'el precio es muy accesible para lo que ofrece increible', clase: 'positivo' },
  { texto: 'la calefaccion funciona bien nunca pase frio', clase: 'positivo' },
  { texto: 'instalaciones en perfecto estado lo recomiendo', clase: 'positivo' },
  { texto: 'habitacion amplia limpia y bien amueblada', clase: 'positivo' },
  { texto: 'el arrendador siempre disponible resuelve todo en menos de un dia', clase: 'positivo' },
  { texto: 'el agua caliente funciona perfecto las 24 horas del dia', clase: 'positivo' },
  { texto: 'excelente ubicacion con todos los servicios volveria sin duda', clase: 'positivo' },
  { texto: 'el bano esta impecable y el agua caliente siempre', clase: 'positivo' },
  { texto: 'internet rapido y agua caliente siempre lo recomiendo', clase: 'positivo' },
  { texto: 'vecinos tranquilos ambiente agradable lo recomiendo', clase: 'positivo' },

  // ════════════════════════════════════════════════════════════
  //POSITIVOS CON NEGACIÓN
  // "no está sucio" = limpio | "nunca falló" = confiable
  // El tokenizador convierte "no_sucio" como token positivo
  // ════════════════════════════════════════════════════════════
  { texto: 'no esta sucio el lugar es muy limpio y ordenado', clase: 'positivo' },
  { texto: 'nunca fallo la luz ni el agua excelente servicio', clase: 'positivo' },
  { texto: 'no me arrepiento para nada de haber rentado aqui', clase: 'positivo' },
  { texto: 'no hay problemas con el agua siempre hay buena presion', clase: 'positivo' },
  { texto: 'no tuve ningun problema durante toda mi estancia genial', clase: 'positivo' },
  { texto: 'no encontre cucarachas ni plagas muy higienico', clase: 'positivo' },
  { texto: 'no es caro para todo lo que incluye muy buen precio', clase: 'positivo' },
  { texto: 'el bano no tiene fugas esta en perfecto estado', clase: 'positivo' },
  { texto: 'no hay ruido los vecinos son super tranquilos', clase: 'positivo' },
  { texto: 'no tuve problemas con el internet siempre rapido', clase: 'positivo' },

  // ════════════════════════════════════════════════════════════
  // POSITIVOS MIXTOS → CONCLUSIÓN POSITIVA
  // Tienen aspectos negativos pero la conclusión final es positiva
  // Ejemplo: "pequeño pero limpio y seguro → recomendable"
  // ════════════════════════════════════════════════════════════
  { texto: 'aunque el precio es alto el lugar esta muy limpio y bien mantenido lo recomiendo', clase: 'positivo' },
  { texto: 'aunque esta lejos del metro el lugar es excelente limpio y seguro', clase: 'positivo' },
  { texto: 'no tiene lavanderia pero todo lo demas es excelente muy recomendable', clase: 'positivo' },
  { texto: 'el cuarto es pequeno pero limpio seguro y bien ubicado recomendable para estudiantes', clase: 'positivo' },
  { texto: 'tiene pocas fallas pero en general es un buen lugar lo recomiendo', clase: 'positivo' },
  { texto: 'no es el mas barato pero la calidad es muy buena lo recomiendo ampliamente', clase: 'positivo' },
  { texto: 'el internet es lento pero el arrendador es excelente y el lugar muy limpio', clase: 'positivo' },
  { texto: 'el cuarto es chico pero muy limpio y el dueno muy atento recomendable', clase: 'positivo' },

  // ════════════════════════════════════════════════════════════
  // NEGATIVOS SIMPLES
  // Quejas directas sin ambigüedad
  // ════════════════════════════════════════════════════════════
  { texto: 'el deposito no te lo devuelven inventan pretextos abusivos', clase: 'negativo' },
  { texto: 'cobran demasiado para lo malo que es una estafa absoluta', clase: 'negativo' },
  { texto: 'bano roto con fugas sin arreglar fue un error', clase: 'negativo' },
  { texto: 'calefaccion rota hace mucho frio no lo recomiendo', clase: 'negativo' },
  { texto: 'la zona es muy peligrosa hay asaltos frecuentes no recomiendo', clase: 'negativo' },
  { texto: 'problemas con agua luz e internet fue un error', clase: 'negativo' },
  { texto: 'problemas con agua luz e internet no lo recomiendo', clase: 'negativo' },
  { texto: 'las areas comunes nunca se limpian estan llenas de basura', clase: 'negativo' },
  { texto: 'llegue y habia cucarachas en la cocina asqueroso e insalubre', clase: 'negativo' },
  { texto: 'el dueno sube el precio sin avisar es un abuso', clase: 'negativo' },
  { texto: 'el propietario sube el precio unilateralmente sin avisar abusivo', clase: 'negativo' },
  { texto: 'bano roto con fugas sin arreglar no volveria', clase: 'negativo' },
  { texto: 'la cerradura esta rota hace semanas y no la arreglan', clase: 'negativo' },
  { texto: 'me robaron en el edificio no hay seguridad alguna peligroso', clase: 'negativo' },
  { texto: 'el ruido de los vecinos es insoportable no se puede dormir', clase: 'negativo' },
  { texto: 'techo con goteras cuando llueve se moja todo horrible', clase: 'negativo' },
  { texto: 'la luz se va constantemente tres veces por semana pesimo', clase: 'negativo' },
  { texto: 'lugar sucio con plagas y mal olor no volveria', clase: 'negativo' },
  { texto: 'zona insegura y con mucho ruido fue un error', clase: 'negativo' },
  { texto: 'el deposito nunca lo devuelven no volveria', clase: 'negativo' },
  { texto: 'el ruido de la calle entra directo al cuarto no descansas', clase: 'negativo' },
  { texto: 'zona insegura y con mucho ruido no volveria', clase: 'negativo' },
  { texto: 'el bano tiene moho en las paredes y huele horrible', clase: 'negativo' },
  { texto: 'el arrendador es amable pero el departamento tiene plagas y huele mal pesimo', clase: 'negativo' },
  { texto: 'demasiado caro para lo pesimo que es fue un error', clase: 'negativo' },
  { texto: 'vecinos ruidosos no se puede dormir fue un error', clase: 'negativo' },
  { texto: 'el arrendador nunca responde ni ayuda no lo recomiendo', clase: 'negativo' },
  { texto: 'bano roto con fugas sin arreglar no lo recomiendo', clase: 'negativo' },
  { texto: 'el arrendador no responde mensajes muy irresponsable', clase: 'negativo' },
  { texto: 'el arrendador desaparece cuando hay problemas es irresponsable', clase: 'negativo' },
  { texto: 'hay una fiesta todos los fines de semana es horrible', clase: 'negativo' },
  { texto: 'me arrepiento de haber rentado aqui fue un error', clase: 'negativo' },
  { texto: 'problemas constantes con el agua se va todo el dia', clase: 'negativo' },
  { texto: 'demasiado caro para lo que ofrece una estafa', clase: 'negativo' },
  { texto: 'lugar sucio con plagas y mal olor fue un error', clase: 'negativo' },
  { texto: 'no hay ventilacion hace un calor insoportable en verano', clase: 'negativo' },
  { texto: 'el precio sube cada tres meses sin mejoras es un abuso', clase: 'negativo' },
  { texto: 'el dueno es grosero y prepotente nunca ayuda con nada', clase: 'negativo' },
  { texto: 'vecinos conflictivos y ruidosos no se puede descansar', clase: 'negativo' },
  { texto: 'vecinos ruidosos no se puede dormir no lo recomiendo', clase: 'negativo' },
  { texto: 'la puerta no cierra bien muy inseguro da miedo', clase: 'negativo' },
  { texto: 'el dueno es grosero y nunca ayuda con nada pesimo', clase: 'negativo' },
  { texto: 'cucarachas en cocina y dormitorio no volveria', clase: 'negativo' },
  { texto: 'el deposito nunca lo devuelven fue un error', clase: 'negativo' },
  { texto: 'cobran por servicios que no funcionan es una estafa', clase: 'negativo' },
  { texto: 'lugar sucio lleno de cucarachas y mal olor horrible', clase: 'negativo' },
  { texto: 'plagas en toda la cocina cucarachas y ratones asqueroso', clase: 'negativo' },
  { texto: 'el arrendador nunca responde ni ayuda no volveria', clase: 'negativo' },
  { texto: 'demasiado caro para lo pesimo que es no volveria', clase: 'negativo' },
  { texto: 'demasiado caro para lo pesimo que es no lo recomiendo', clase: 'negativo' },
  { texto: 'muy frio en invierno la calefaccion no funciona terrible', clase: 'negativo' },
  { texto: 'pague el deposito y nunca me lo regresaron ladrones', clase: 'negativo' },
  { texto: 'el bano tiene fugas y goteras nadie las arregla', clase: 'negativo' },
  { texto: 'paredes con humedad y moho muy insalubre para vivir', clase: 'negativo' },
  { texto: 'zona insegura y con mucho ruido no lo recomiendo', clase: 'negativo' },
  { texto: 'las instalaciones electricas son un peligro pueden causar incendio', clase: 'negativo' },
  { texto: 'el agua se va todos los dias desde las 7am hasta las 2pm horrible', clase: 'negativo' },
  { texto: 'no hay agua caliente tienes que banarte con agua fria terrible', clase: 'negativo' },
  { texto: 'la puerta del edificio siempre abierta cualquiera entra inseguro', clase: 'negativo' },
  { texto: 'mucho ruido de vecinos no se puede dormir ni estudiar', clase: 'negativo' },
  { texto: 'vecinos ruidosos no se puede dormir no volveria', clase: 'negativo' },
  { texto: 'el agua tiene mal olor y color raro da asco', clase: 'negativo' },
  { texto: 'calefaccion rota hace mucho frio no volveria', clase: 'negativo' },
  { texto: 'el agua tiene mal color y huele raro imposible usarla', clase: 'negativo' },
  { texto: 'cobran servicios basicos aparte muy caro no vale nada', clase: 'negativo' },
  { texto: 'precio accesible pero las instalaciones estan en mal estado no vale la pena', clase: 'negativo' },
  { texto: 'lugar sucio con plagas y mal olor no lo recomiendo', clase: 'negativo' },
  { texto: 'el arrendador nunca responde ni ayuda fue un error', clase: 'negativo' },
  { texto: 'el deposito nunca lo devuelven no lo recomiendo', clase: 'negativo' },
  { texto: 'prometen wifi y no hay o es tan lento que no sirve', clase: 'negativo' },
  { texto: 'cucarachas en cocina y dormitorio no lo recomiendo', clase: 'negativo' },
  { texto: 'no recomiendo este lugar para nada fue terrible', clase: 'negativo' },
  { texto: 'cobran servicios por separado y al final sale carísimo engano', clase: 'negativo' },
  { texto: 'el wifi se cae constantemente es imposible estudiar en linea', clase: 'negativo' },
  { texto: 'internet muy lento o sin servicio constantemente', clase: 'negativo' },
  { texto: 'cucarachas en cocina y dormitorio fue un error', clase: 'negativo' },
  { texto: 'problemas con agua luz e internet no volveria', clase: 'negativo' },
  { texto: 'no hay internet aunque lo prometieron en el contrato mentirosos', clase: 'negativo' },
  { texto: 'calefaccion rota hace mucho frio fue un error', clase: 'negativo' },
  { texto: 'zona muy peligrosa me robaron dos veces inseguro', clase: 'negativo' },
  { texto: 'el internet es tan lento que no carga ni un video frustrante', clase: 'negativo' },
  { texto: 'muy lejos del ipn y el transporte es caro y tardado', clase: 'negativo' },

  // ════════════════════════════════════════════════════════════
  // NEGATIVOS CON NEGACIÓN
  // "no recomiendo" | "jamás volvería" | "nunca devolvieron"
  // El tokenizador convierte "no_recomiendo" como token negativo
  // ════════════════════════════════════════════════════════════
  { texto: 'no vale lo que cobran es un abuso de precio', clase: 'negativo' },
  { texto: 'jamas volveria a rentar aqui fue lo peor', clase: 'negativo' },
  { texto: 'tampoco tienen agua caliente es insoportable en invierno', clase: 'negativo' },
  { texto: 'no hay seguridad me siento en peligro todo el tiempo', clase: 'negativo' },
  { texto: 'no recomiendo este lugar para absolutamente nada terrible', clase: 'negativo' },
  { texto: 'no hay agua por las mananas es imposible vivir aqui', clase: 'negativo' },
  { texto: 'nunca devolvieron mi deposito son unos ladrones', clase: 'negativo' },
  { texto: 'no hay agua por las mananas imposible banarse para ir a clases', clase: 'negativo' },
  { texto: 'no cumple con nada de lo prometido fue una mentira', clase: 'negativo' },
  { texto: 'no se puede dormir con tanto ruido es horrible', clase: 'negativo' },
  { texto: 'no funciona el internet desde que llegue nadie lo arregla', clase: 'negativo' },

  // ════════════════════════════════════════════════════════════
  // NEGATIVOS MIXTOS → CONCLUSIÓN NEGATIVA
  // Tienen aspectos positivos (ubicación, espacio) pero los
  // problemas dominan y la conclusión final es negativa
  // Ejemplo: "amplio pero baño mal estado, no recomendaría"
  // ════════════════════════════════════════════════════════════
  { texto: 'aunque esta bien ubicado el bano tiene fugas y no lo recomendaria', clase: 'negativo' },
  { texto: 'el cuarto es amplio pero hay problemas constantes con el agua no recomiendo', clase: 'negativo' },
  { texto: 'en general no lo recomendaria tiene demasiados problemas para el precio', clase: 'negativo' },
  { texto: 'a pesar de la buena ubicacion no lo recomendaria por los problemas', clase: 'negativo' },
  { texto: 'internet rapido pero el lugar esta sucio y hay problemas con la luz malo', clase: 'negativo' },
  { texto: 'la habitacion es grande pero hay cucarachas y el bano esta roto horrible', clase: 'negativo' },
  { texto: 'la zona es buena pero el dueno no resuelve nada y cobran de mas terrible', clase: 'negativo' },
  { texto: 'bonita zona pero interior deteriorado con humedad y mal olor no recomiendo', clase: 'negativo' },
  { texto: 'buena ubicacion pero el lugar esta sucio y deteriorado no volveria', clase: 'negativo' },
  { texto: 'bien ubicado pero mucho ruido vecinos conflictivos no lo recomendaria', clase: 'negativo' },
  { texto: 'departamento amplio bien ubicado pero bano mal estado y problemas de agua no recomendaria', clase: 'negativo' },

  // ════════════════════════════════════════════════════════════
  // NEGATIVOS CON SARCASMO / IRONÍA
  // Palabras aparentemente positivas ("excelente", "perfecto",
  // "ideal") usadas irónicamente en contexto negativo
  // Ejemplo: "excelente si te gusta vivir sin agua"
  // ════════════════════════════════════════════════════════════
  { texto: 'maravilloso lugar donde el arrendador desaparece cuando hay problemas', clase: 'negativo' },
  { texto: 'perfecto si disfrutas el ruido toda la noche sin poder dormir', clase: 'negativo' },
  { texto: 'si te gusta vivir sin agua este es tu lugar excelente para deshidratarte', clase: 'negativo' },
  { texto: 'excelente opcion si buscas pagar mucho por recibir muy poco', clase: 'negativo' },
  { texto: 'ideal para quien quiera convivir con cucarachas y ratas de mascota', clase: 'negativo' },

  // ════════════════════════════════════════════════════════════
  // NEUTRALES / AMBIGUOS
  // Opiniones balanceadas, comparaciones relativas, condiciones,
  // frases ambiguas como "cumple con lo básico"
  // ════════════════════════════════════════════════════════════
  { texto: 'cumple con lo basico nada especial ni bueno ni malo', clase: 'neutral' },
  { texto: 'hay cosas por mejorar pero en general es aceptable', clase: 'neutral' },
  { texto: 'la habitacion es comoda pero muy pequena para dos personas', clase: 'neutral' },
  { texto: 'el arrendador responde pero a veces tarda varios dias', clase: 'neutral' },
  { texto: 'no es perfecto pero tampoco un desastre es del monton', clase: 'neutral' },
  { texto: 'el arrendador es amable pero no resuelve los problemas rapido', clase: 'neutral' },
  { texto: 'cumple con lo basico nada especial mas o menos', clase: 'neutral' },
  { texto: 'las instalaciones estan pasables necesitan algo de mantenimiento', clase: 'neutral' },
  { texto: 'aceptable para una estancia temporal mas o menos', clase: 'neutral' },
  { texto: 'tiene cosas buenas y cosas malas en general aceptable', clase: 'neutral' },
  { texto: 'regular sin grandes problemas ni ventajas mas o menos', clase: 'neutral' },
  { texto: 'hay cosas por mejorar pero funciona en general', clase: 'neutral' },
  { texto: 'el internet es medio lento pero para cosas basicas funciona', clase: 'neutral' },
  { texto: 'para el precio esta mas o menos bien mas o menos', clase: 'neutral' },
  { texto: 'la zona es buena pero el edificio necesita mantenimiento', clase: 'neutral' },
  { texto: 'mas o menos lo que esperaba nada que destacar', clase: 'neutral' },
  { texto: 'el precio es justo ni muy barato ni muy caro normal', clase: 'neutral' },
  { texto: 'el bano esta bien pero la cocina podria mejorar un poco', clase: 'neutral' },
  { texto: 'hay ruido a veces pero no es insoportable', clase: 'neutral' },
  { texto: 'el precio podria ser menor pero no esta tan mal', clase: 'neutral' },
  { texto: 'sirve para lo basico sin extras en general', clase: 'neutral' },
  { texto: 'el cuarto estaba limpio aunque las areas comunes podrian mejorar', clase: 'neutral' },
  { texto: 'el precio es justo por lo basico que ofrece', clase: 'neutral' },
  { texto: 'cumple su funcion aunque con algunos inconvenientes menores', clase: 'neutral' },
  { texto: 'podria mejorar pero es aceptable mas o menos', clase: 'neutral' },
  { texto: 'sirve para lo basico sin extras mas o menos', clase: 'neutral' },
  { texto: 'el arrendador tarda en responder pero al final responde', clase: 'neutral' },
  { texto: 'el agua falla ocasionalmente pero no es frecuente', clase: 'neutral' },
  { texto: 'no es perfecto pero tampoco terrible en general', clase: 'neutral' },
  { texto: 'el agua falla ocasionalmente pero no es muy frecuente', clase: 'neutral' },
  { texto: 'tiene cosas buenas y malas en general mas o menos', clase: 'neutral' },
  { texto: 'bien ubicado pero el edificio esta un poco descuidado', clase: 'neutral' },
  { texto: 'si buscas algo basico y economico puede servir si no busca otro', clase: 'neutral' },
  { texto: 'para el precio que tiene no esta tan mal podria ser peor', clase: 'neutral' },
  { texto: 'no es el peor lugar que he visto pero tampoco el mejor', clase: 'neutral' },
  { texto: 'hay cosas por mejorar pero funciona mas o menos', clase: 'neutral' },
  { texto: 'no es el mejor lugar pero tampoco el peor que he visto', clase: 'neutral' },
  { texto: 'no es perfecto pero tampoco terrible mas o menos', clase: 'neutral' },
  { texto: 'regular sin grandes quejas pero tampoco elogios', clase: 'neutral' },
  { texto: 'aceptable para una estancia temporal en general', clase: 'neutral' },
  { texto: 'comparado con otros lugares de la zona este esta bien', clase: 'neutral' },
  { texto: 'para el precio que tiene esta mas o menos bien', clase: 'neutral' },
  { texto: 'hay dias buenos y dias malos en general se puede vivir aqui', clase: 'neutral' },
  { texto: 'el dueno es amable pero no siempre resuelve los problemas rapido', clase: 'neutral' },
  { texto: 'podria mejorar pero es aceptable en general', clase: 'neutral' },
  { texto: 'ni muy bueno ni muy malo para una estancia corta sirve', clase: 'neutral' },
  { texto: 'lo recomendaria solo si no encuentras algo mejor en la zona', clase: 'neutral' },
  { texto: 'la limpieza es regular a veces limpio a veces no tanto', clase: 'neutral' },
  { texto: 'hay algo de ruido pero no es insoportable se puede vivir', clase: 'neutral' },
  { texto: 'el lugar es sencillo sin lujos pero funcional para vivir', clase: 'neutral' },
  { texto: 'algunos servicios fallan de vez en cuando pero no siempre', clase: 'neutral' },
  { texto: 'el wifi funciona bien a veces lento pero en general aceptable', clase: 'neutral' },
  { texto: 'a veces falla el agua pero generalmente esta bien', clase: 'neutral' },
  { texto: 'no tiene todos los servicios prometidos pero lo basico si', clase: 'neutral' },
  { texto: 'ni muy bueno ni muy malo mas o menos', clase: 'neutral' },
  { texto: 'el cuarto es basico pero limpio y funcional', clase: 'neutral' },
  { texto: 'mas o menos como esperaba nada que me sorprendiera bien ni mal', clase: 'neutral' },
  { texto: 'cumple con lo basico nada especial en general', clase: 'neutral' },
  { texto: 'podria estar mejor mantenido pero no esta en mal estado', clase: 'neutral' },
  { texto: 'nada sorprendente pero tampoco tiene grandes problemas', clase: 'neutral' },
  { texto: 'un poco caro para lo que ofrece pero no terrible', clase: 'neutral' },
  { texto: 'el precio esta bien pero hay cosas por mejorar', clase: 'neutral' },
  { texto: 'para el precio esta mas o menos bien en general', clase: 'neutral' },
  { texto: 'la ubicacion es buena pero el cuarto es muy pequeno', clase: 'neutral' },
  { texto: 'ni muy bueno ni muy malo en general', clase: 'neutral' },
  { texto: 'la comunicacion con el dueno es regular mejora y empeora', clase: 'neutral' },
  { texto: 'de dia tranquilo de noche algo de ruido de la calle', clase: 'neutral' },
  { texto: 'el internet es lento pero el resto del lugar esta bien', clase: 'neutral' },
  { texto: 'tiene cosas buenas y malas en general en general', clase: 'neutral' },
  { texto: 'la zona es tranquila de dia pero de noche algo insegura', clase: 'neutral' },
  { texto: 'sirve para lo que necesito ni mas ni menos', clase: 'neutral' },
  { texto: 'regular sin grandes problemas ni ventajas en general', clase: 'neutral' },
  { texto: 'la seguridad es regular hay vigilante solo en el dia', clase: 'neutral' },
  { texto: 'tiene sus pros y sus contras como cualquier lugar', clase: 'neutral' },
]

// ── Normalizar texto ─────────────────────────────────────────────
const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()

// ── Tokenizar con manejo de negaciones ──────────────────────────
const NEGACIONES = new Set(['no', 'ni', 'sin', 'jamas', 'nunca', 'tampoco', 'nada', 'nadie'])

const tokenizar = (texto) => {
  const palabras = normalizar(texto).split(/\s+/).filter(w => w.length > 1)
  const tokens = []
  let negar = false
  for (let i = 0; i < palabras.length; i++) {
    const palabra = palabras[i]
    if (NEGACIONES.has(palabra)) { negar = true; continue }
    if (palabra.length <= 2) continue
    tokens.push(negar ? `no_${palabra}` : palabra)
    negar = false
  }
  return tokens
}

// ── Entrenar Naive Bayes ─────────────────────────────────────────
const CLASES = ['positivo', 'negativo', 'neutral']
const frecuencias = {}
const totalPorClase = {}
const docsPorClase  = {}
const totalDocs = DATOS.length

CLASES.forEach(c => {
  frecuencias[c]   = {}
  totalPorClase[c] = 0
  docsPorClase[c]  = 0
})

DATOS.forEach(({ texto, clase }) => {
  docsPorClase[clase]++
  tokenizar(texto).forEach(p => {
    frecuencias[clase][p] = (frecuencias[clase][p] || 0) + 1
    totalPorClase[clase]++
  })
})

const vocabulario = new Set(DATOS.flatMap(d => tokenizar(d.texto)))
const V = vocabulario.size

// ── Clasificar con Naive Bayes (suavizado de Laplace) ────────────
const analizarSentimiento = (texto) => {
  if (!texto || texto.trim().length === 0) return 'neutral'
  const palabras = tokenizar(texto)
  if (palabras.length === 0) return 'neutral'

  let mejorClase = 'neutral'
  let mejorScore = -Infinity

  CLASES.forEach(clase => {
    let score = Math.log(docsPorClase[clase] / totalDocs)
    palabras.forEach(palabra => {
      const count = frecuencias[clase][palabra] || 0
      score += Math.log((count + 1) / (totalPorClase[clase] + V))
    })
    if (score > mejorScore) {
      mejorScore = score
      mejorClase = clase
    }
  })

  return mejorClase
}

module.exports = { analizarSentimiento }