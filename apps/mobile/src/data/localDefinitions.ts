// Base local didáctica y bilingüe para lecturas infantiles (generada desde la app Flutter original).
import type { WordDefinition } from '../services/dictionaryService';

export const ACCENT_FALLBACK: Record<string, string> = {
  "arbol": "árbol",
  "pajaro": "pájaro",
  "cancion": "canción",
  "leccion": "lección",
  "oracion": "oración",
  "mama": "mamá",
  "papa": "papá",
  "corazon": "corazón",
  "habia": "había",
  "dia": "día",
  "tio": "tío",
  "tia": "tía",
  "jardin": "jardín",
  "raton": "ratón",
  "leon": "león",
  "bebe": "bebé",
  "magico": "mágico",
  "musica": "música",
  "lapiz": "lápiz",
  "rapido": "rápido",
  "despues": "después",
  "tambien": "también"
};

export const LOCAL_DEFINITIONS: Record<string, WordDefinition> = {
  "había": {
    "word": "había",
    "displayWord": "Había",
    "partOfSpeech": "verbo",
    "meaning": "Forma del verbo haber. Indica la existencia o presencia de algo en el pasado, muy común al comenzar historias.",
    "example": "Había una vez un pequeño bosque lleno de flores."
  },
  "haber": {
    "word": "haber",
    "displayWord": "Haber",
    "partOfSpeech": "verbo",
    "meaning": "Verbo que expresa existencia de personas o cosas, o sirve como auxiliar para otros verbos."
  },
  "vez": {
    "word": "vez",
    "displayWord": "Vez",
    "partOfSpeech": "sustantivo",
    "meaning": "Momento u ocasión determinada en el tiempo en que ocurre algo.",
    "example": "Había una vez un lindo cuento."
  },
  "uno": {
    "word": "uno",
    "displayWord": "Uno",
    "partOfSpeech": "artículo / número",
    "meaning": "Indica una sola persona, animal o cosa."
  },
  "una": {
    "word": "una",
    "displayWord": "Una",
    "partOfSpeech": "artículo",
    "meaning": "Acompaña a un sustantivo femenino para indicar un solo elemento.",
    "example": "Una hermosa mañana de sol."
  },
  "el": {
    "word": "el",
    "displayWord": "El",
    "partOfSpeech": "artículo",
    "meaning": "Acompaña a un sustantivo masculino para indicar que ya es conocido en la lectura."
  },
  "la": {
    "word": "la",
    "displayWord": "La",
    "partOfSpeech": "artículo",
    "meaning": "Acompaña a un sustantivo femenino para identificarlo con claridad."
  },
  "los": {
    "word": "los",
    "displayWord": "Los",
    "partOfSpeech": "artículo",
    "meaning": "Indica varios elementos masculinos conocidos."
  },
  "las": {
    "word": "las",
    "displayWord": "Las",
    "partOfSpeech": "artículo",
    "meaning": "Indica varios elementos femeninos conocidos."
  },
  "este": {
    "word": "este",
    "displayWord": "Este",
    "partOfSpeech": "demostrativo",
    "meaning": "Señala a una persona, animal o cosa que está cerca de quien habla o lee."
  },
  "esta": {
    "word": "esta",
    "displayWord": "Esta",
    "partOfSpeech": "demostrativo",
    "meaning": "Señala un elemento femenino que está cercano en el espacio o en el tiempo."
  },
  "todo": {
    "word": "todo",
    "displayWord": "Todo",
    "partOfSpeech": "adjetivo / pronombre",
    "meaning": "Indica la totalidad completa sin que falte ninguna parte."
  },
  "todos": {
    "word": "todos",
    "displayWord": "Todos",
    "partOfSpeech": "adjetivo / pronombre",
    "meaning": "La totalidad de personas, seres o cosas que integran un grupo.",
    "example": "Todos los niños salieron a jugar juntos."
  },
  "mucho": {
    "word": "mucho",
    "displayWord": "Mucho",
    "partOfSpeech": "adjetivo / adverbio",
    "meaning": "En gran cantidad, abundancia o intensidad."
  },
  "poco": {
    "word": "poco",
    "displayWord": "Poco",
    "partOfSpeech": "adjetivo / adverbio",
    "meaning": "En escasa cantidad o pequeña porción."
  },
  "muy": {
    "word": "muy",
    "displayWord": "Muy",
    "partOfSpeech": "adverbio",
    "meaning": "Aumenta la intensidad o cualidad de la palabra que acompaña.",
    "example": "El niño estaba muy feliz."
  },
  "más": {
    "word": "más",
    "displayWord": "Más",
    "partOfSpeech": "adverbio",
    "meaning": "Indica una cantidad o grado superior en comparación con otro."
  },
  "menos": {
    "word": "menos",
    "displayWord": "Menos",
    "partOfSpeech": "adverbio",
    "meaning": "Indica una cantidad o grado inferior."
  },
  "bien": {
    "word": "bien",
    "displayWord": "Bien",
    "partOfSpeech": "adverbio",
    "meaning": "De manera correcta, agradable, satisfactoria o adecuada."
  },
  "mal": {
    "word": "mal",
    "displayWord": "Mal",
    "partOfSpeech": "adverbio",
    "meaning": "De manera contraria a lo bueno, adecuado o conveniente."
  },
  "siempre": {
    "word": "siempre",
    "displayWord": "Siempre",
    "partOfSpeech": "adverbio",
    "meaning": "En todo momento, sin interrupción o en todas las ocasiones.",
    "example": "Los amigos siempre se ayudan."
  },
  "nunca": {
    "word": "nunca",
    "displayWord": "Nunca",
    "partOfSpeech": "adverbio",
    "meaning": "En ningún momento o en ninguna ocasión."
  },
  "después": {
    "word": "después",
    "displayWord": "Después",
    "partOfSpeech": "adverbio",
    "meaning": "En un momento posterior en el tiempo o a continuación de algo.",
    "example": "Después de leer, fuimos al parque."
  },
  "antes": {
    "word": "antes",
    "displayWord": "Antes",
    "partOfSpeech": "adverbio",
    "meaning": "En un tiempo previo o que precede a otro suceso."
  },
  "ahora": {
    "word": "ahora",
    "displayWord": "Ahora",
    "partOfSpeech": "adverbio",
    "meaning": "En el tiempo presente o en este preciso instante."
  },
  "entonces": {
    "word": "entonces",
    "displayWord": "Entonces",
    "partOfSpeech": "adverbio / conector",
    "meaning": "En aquel tiempo o como consecuencia de lo que ocurrió."
  },
  "mientras": {
    "word": "mientras",
    "displayWord": "Mientras",
    "partOfSpeech": "conector",
    "meaning": "Durante el tiempo en que transcurre otra acción simultánea."
  },
  "cuando": {
    "word": "cuando",
    "displayWord": "Cuando",
    "partOfSpeech": "conector",
    "meaning": "Indica el momento u ocasión en que sucede algo."
  },
  "donde": {
    "word": "donde",
    "displayWord": "Donde",
    "partOfSpeech": "adverbio",
    "meaning": "Indica el lugar o sitio en el que ocurre una acción."
  },
  "porque": {
    "word": "porque",
    "displayWord": "Porque",
    "partOfSpeech": "conector",
    "meaning": "Explica la causa, motivo o razón por la cual pasa algo.",
    "example": "Sonreía porque estaba alegre."
  },
  "juntos": {
    "word": "juntos",
    "displayWord": "Juntos",
    "partOfSpeech": "adjetivo / adverbio",
    "meaning": "Unidos en compañía de otros compartiendo una actividad.",
    "example": "Leyeron el cuento juntos en familia."
  },
  "solo": {
    "word": "solo",
    "displayWord": "Solo",
    "partOfSpeech": "adjetivo",
    "meaning": "Sin compañía de otra persona o elemento."
  },
  "niño": {
    "word": "niño",
    "displayWord": "Niño",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona de corta edad que está en la etapa de la niñez, jugando, aprendiendo y creciendo.",
    "example": "El niño descubrió un libro mágico."
  },
  "niña": {
    "word": "niña",
    "displayWord": "Niña",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona femenina de corta edad en su etapa de infancia.",
    "example": "La niña sonreía con emoción."
  },
  "bebé": {
    "word": "bebé",
    "displayWord": "Bebé",
    "partOfSpeech": "sustantivo",
    "meaning": "Niño muy pequeño recién nacido que recibe el cuidado amoroso de su familia."
  },
  "papá": {
    "word": "papá",
    "displayWord": "Papá",
    "partOfSpeech": "sustantivo",
    "meaning": "Padre. Hombre que cuida, guía y ama profundamente a sus hijos.",
    "example": "Papá lee un cuento antes de dormir."
  },
  "padre": {
    "word": "padre",
    "displayWord": "Padre",
    "partOfSpeech": "sustantivo",
    "meaning": "Varón que ha engendrado o adoptado a un hijo y forma un pilar en la familia."
  },
  "padres": {
    "word": "padres",
    "displayWord": "Padres",
    "partOfSpeech": "sustantivo",
    "meaning": "El papá y la mamá juntos; responsables de cuidar, educar y apoyar a sus hijos.",
    "example": "Mis padres me acompañan en la escuela."
  },
  "mamá": {
    "word": "mamá",
    "displayWord": "Mamá",
    "partOfSpeech": "sustantivo",
    "meaning": "Madre. Mujer que cuida, educa y protege a sus hijos con amor incondicional.",
    "example": "Mamá me ayuda a practicar la lectura."
  },
  "madre": {
    "word": "madre",
    "displayWord": "Madre",
    "partOfSpeech": "sustantivo",
    "meaning": "Mujer que ha tenido o adoptado un hijo y le brinda cariño y cuidados."
  },
  "hijo": {
    "word": "hijo",
    "displayWord": "Hijo",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona respecto de su padre y de su madre."
  },
  "hija": {
    "word": "hija",
    "displayWord": "Hija",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona femenina respecto de sus padres."
  },
  "hermano": {
    "word": "hermano",
    "displayWord": "Hermano",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona que tiene los mismos padres que otra y comparte el crecimiento familiar."
  },
  "hermana": {
    "word": "hermana",
    "displayWord": "Hermana",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona femenina que tiene los mismos padres que otra."
  },
  "abuelo": {
    "word": "abuelo",
    "displayWord": "Abuelo",
    "partOfSpeech": "sustantivo",
    "meaning": "Padre del padre o de la madre de una persona, lleno de historias y sabiduría."
  },
  "abuela": {
    "word": "abuela",
    "displayWord": "Abuela",
    "partOfSpeech": "sustantivo",
    "meaning": "Madre del padre o de la madre de una persona, llena de cariño y ternura."
  },
  "amigo": {
    "word": "amigo",
    "displayWord": "Amigo",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona con quien se tiene una relación especial de afecto, confianza, respeto y juegos.",
    "example": "Mi mejor amigo comparte sus lápices conmigo."
  },
  "amiga": {
    "word": "amiga",
    "displayWord": "Amiga",
    "partOfSpeech": "sustantivo",
    "meaning": "Compañera con quien se comparte cariño, juegos y aventuras."
  },
  "familia": {
    "word": "familia",
    "displayWord": "Familia",
    "partOfSpeech": "sustantivo",
    "meaning": "Grupo de personas unidas por el amor y parentesco que conviven, se ayudan y aprenden juntas."
  },
  "maestro": {
    "word": "maestro",
    "displayWord": "Maestro",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona dedicada a enseñar, educar y guiar a los niños en su camino de aprendizaje."
  },
  "maestra": {
    "word": "maestra",
    "displayWord": "Maestra",
    "partOfSpeech": "sustantivo",
    "meaning": "Profesora que enseña con paciencia y entusiasmo en la escuela."
  },
  "profesor": {
    "word": "profesor",
    "displayWord": "Profesor",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona que tiene por oficio enseñar una materia o arte."
  },
  "profesora": {
    "word": "profesora",
    "displayWord": "Profesora",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona femenina que se dedica a la enseñanza profesional."
  },
  "estudiante": {
    "word": "estudiante",
    "displayWord": "Estudiante",
    "partOfSpeech": "sustantivo",
    "meaning": "Persona que asiste a clases y dedica tiempo a aprender y explorar nuevos saberes."
  },
  "escuela": {
    "word": "escuela",
    "displayWord": "Escuela",
    "partOfSpeech": "sustantivo",
    "meaning": "Institución y edificio donde los niños y jóvenes van a estudiar, aprender, convivir y jugar.",
    "example": "Cada día voy contento a la escuela."
  },
  "colegio": {
    "word": "colegio",
    "displayWord": "Colegio",
    "partOfSpeech": "sustantivo",
    "meaning": "Centro escolar donde se imparte enseñanza a los alumnos."
  },
  "libro": {
    "word": "libro",
    "displayWord": "Libro",
    "partOfSpeech": "sustantivo",
    "meaning": "Conjunto de páginas encuadernadas que contienen textos, cuentos e imágenes para leer y aprender.",
    "example": "Este libro nos cuenta una historia maravillosa."
  },
  "libros": {
    "word": "libros",
    "displayWord": "Libros",
    "partOfSpeech": "sustantivo",
    "meaning": "Varios volúmenes de lectura y aprendizaje que abren mundos a la imaginación."
  },
  "página": {
    "word": "página",
    "displayWord": "Página",
    "partOfSpeech": "sustantivo",
    "meaning": "Cada una de las dos caras de una hoja de papel en un libro o cuaderno."
  },
  "páginas": {
    "word": "páginas",
    "displayWord": "Páginas",
    "partOfSpeech": "sustantivo",
    "meaning": "Hojas que forman el cuerpo de un libro donde se lee la historia."
  },
  "cuento": {
    "word": "cuento",
    "displayWord": "Cuento",
    "partOfSpeech": "sustantivo",
    "meaning": "Relato o narración corta de hechos reales o fantásticos, con personajes interesantes.",
    "example": "El cuento del dragón bondadoso."
  },
  "historia": {
    "word": "historia",
    "displayWord": "Historia",
    "partOfSpeech": "sustantivo",
    "meaning": "Narración de sucesos que ocurrieron en el tiempo o relato de ficción estructurado."
  },
  "palabra": {
    "word": "palabra",
    "displayWord": "Palabra",
    "partOfSpeech": "sustantivo",
    "meaning": "Sonido o conjunto de letras que expresa una idea y forma el lenguaje."
  },
  "letra": {
    "word": "letra",
    "displayWord": "Letra",
    "partOfSpeech": "sustantivo",
    "meaning": "Cada uno de los signos gráficos que componen el alfabeto para escribir palabras."
  },
  "oración": {
    "word": "oración",
    "displayWord": "Oración",
    "partOfSpeech": "sustantivo",
    "meaning": "Conjunto de palabras con sentido completo que comunica un mensaje o pensamiento."
  },
  "párrafo": {
    "word": "párrafo",
    "displayWord": "Párrafo",
    "partOfSpeech": "sustantivo",
    "meaning": "Sección de un texto formada por una o más oraciones que expresan una idea central."
  },
  "lápiz": {
    "word": "lápiz",
    "displayWord": "Lápiz",
    "partOfSpeech": "sustantivo",
    "meaning": "Instrumento de madera con mina de grafito que se utiliza para escribir y dibujar."
  },
  "cuaderno": {
    "word": "cuaderno",
    "displayWord": "Cuaderno",
    "partOfSpeech": "sustantivo",
    "meaning": "Conjunto de hojas de papel unidas donde los estudiantes escriben sus notas y ejercicios."
  },
  "clase": {
    "word": "clase",
    "displayWord": "Clase",
    "partOfSpeech": "sustantivo",
    "meaning": "Sesión de enseñanza en la que el profesor y los alumnos trabajan sobre un tema."
  },
  "tarea": {
    "word": "tarea",
    "displayWord": "Tarea",
    "partOfSpeech": "sustantivo",
    "meaning": "Actividad o ejercicio que se realiza en casa para repasar lo aprendido en la escuela."
  },
  "lectura": {
    "word": "lectura",
    "displayWord": "Lectura",
    "partOfSpeech": "sustantivo",
    "meaning": "Acción de leer e interpretar textos para comprender historias e ideas nuevas."
  },
  "árbol": {
    "word": "árbol",
    "displayWord": "Árbol",
    "partOfSpeech": "sustantivo",
    "meaning": "Planta de gran tamaño con tronco de madera, ramas fuertes y muchas hojas verdes que da sombra.",
    "example": "El pajarito construyó su nido en el árbol."
  },
  "bosque": {
    "word": "bosque",
    "displayWord": "Bosque",
    "partOfSpeech": "sustantivo",
    "meaning": "Lugar grande de la naturaleza poblado de muchos árboles, arbustos, flores y animales silvestres.",
    "example": "Caminaron por los senderos del bosque verde."
  },
  "flor": {
    "word": "flor",
    "displayWord": "Flor",
    "partOfSpeech": "sustantivo",
    "meaning": "Parte colorida y perfumada de las plantas que alegra los campos y jardines.",
    "example": "La abeja visitó una flor amarilla."
  },
  "flores": {
    "word": "flores",
    "displayWord": "Flores",
    "partOfSpeech": "sustantivo",
    "meaning": "Conjunto de brotes coloridos de las plantas que adornan la naturaleza."
  },
  "planta": {
    "word": "planta",
    "displayWord": "Planta",
    "partOfSpeech": "sustantivo",
    "meaning": "Ser vivo vegetal que crece en la tierra con raíces, tallo y hojas gracias al agua y al sol."
  },
  "sol": {
    "word": "sol",
    "displayWord": "Sol",
    "partOfSpeech": "sustantivo",
    "meaning": "Gran estrella brillante en el cielo que nos da luz, calor y energía durante el día.",
    "example": "El sol brillante calentaba la mañana."
  },
  "luna": {
    "word": "luna",
    "displayWord": "Luna",
    "partOfSpeech": "sustantivo",
    "meaning": "Astro que acompaña a la Tierra en la noche y refleja suavemente la luz del sol.",
    "example": "La luna llena iluminaba el camino."
  },
  "estrella": {
    "word": "estrella",
    "displayWord": "Estrella",
    "partOfSpeech": "sustantivo",
    "meaning": "Astro luminoso en el cielo nocturno que brilla con su propia luz como un diamante."
  },
  "estrellas": {
    "word": "estrellas",
    "displayWord": "Estrellas",
    "partOfSpeech": "sustantivo",
    "meaning": "Muchos puntos luminosos en el cielo de la noche que forman constelaciones."
  },
  "cielo": {
    "word": "cielo",
    "displayWord": "Cielo",
    "partOfSpeech": "sustantivo",
    "meaning": "Espacio azul visible sobre nuestras cabezas donde vuelan las aves y se ven las nubes."
  },
  "nube": {
    "word": "nube",
    "displayWord": "Nube",
    "partOfSpeech": "sustantivo",
    "meaning": "Masa blanca o gris que flota en el cielo compuesta de gotas de agua."
  },
  "nubes": {
    "word": "nubes",
    "displayWord": "Nubes",
    "partOfSpeech": "sustantivo",
    "meaning": "Formaciones en el cielo que a veces anuncian lluvia refrescante."
  },
  "lluvia": {
    "word": "lluvia",
    "displayWord": "Lluvia",
    "partOfSpeech": "sustantivo",
    "meaning": "Gotas de agua que caen del cielo para regar la tierra y alimentar los ríos."
  },
  "viento": {
    "word": "viento",
    "displayWord": "Viento",
    "partOfSpeech": "sustantivo",
    "meaning": "Corriente de aire en movimiento que refresca y mece las hojas de los árboles."
  },
  "agua": {
    "word": "agua",
    "displayWord": "Agua",
    "partOfSpeech": "sustantivo",
    "meaning": "Líquido transparente y vital para la vida de todos los animales, plantas y personas."
  },
  "río": {
    "word": "río",
    "displayWord": "Río",
    "partOfSpeech": "sustantivo",
    "meaning": "Corriente continua de agua dulce que viaja hacia un lago o el mar."
  },
  "mar": {
    "word": "mar",
    "displayWord": "Mar",
    "partOfSpeech": "sustantivo",
    "meaning": "Gran extensión de agua salada donde habitan peces, ballenas y delfines."
  },
  "montaña": {
    "word": "montaña",
    "displayWord": "Montaña",
    "partOfSpeech": "sustantivo",
    "meaning": "Gran elevación natural del terreno de altura imponente que toca el cielo."
  },
  "tierra": {
    "word": "tierra",
    "displayWord": "Tierra",
    "partOfSpeech": "sustantivo",
    "meaning": "Suelo donde pisamos y sembramos plantas, o el planeta donde vivimos."
  },
  "campo": {
    "word": "campo",
    "displayWord": "Campo",
    "partOfSpeech": "sustantivo",
    "meaning": "Terreno amplio al aire libre rodeado de naturaleza, cultivos y animales."
  },
  "jardín": {
    "word": "jardín",
    "displayWord": "Jardín",
    "partOfSpeech": "sustantivo",
    "meaning": "Espacio cuidado con flores, plantas y pasto para disfrutar al aire libre."
  },
  "gato": {
    "word": "gato",
    "displayWord": "Gato",
    "partOfSpeech": "sustantivo",
    "meaning": "Animal doméstico ágil, curioso y suave que maúlla y ronronea cuando está contento.",
    "example": "El gato duerme bajo el sol."
  },
  "perro": {
    "word": "perro",
    "displayWord": "Perro",
    "partOfSpeech": "sustantivo",
    "meaning": "Animal doméstico muy leal, cariñoso y protector de cuatro patas que mueve la cola al saludar.",
    "example": "El perro corretea alegre en el patio."
  },
  "pájaro": {
    "word": "pájaro",
    "displayWord": "Pájaro",
    "partOfSpeech": "sustantivo",
    "meaning": "Animal con alas, plumas y pico que canta con alegría y vuela por el aire."
  },
  "ave": {
    "word": "ave",
    "displayWord": "Ave",
    "partOfSpeech": "sustantivo",
    "meaning": "Animal vertebrado con alas y plumas capaz de volar por el cielo."
  },
  "pez": {
    "word": "pez",
    "displayWord": "Pez",
    "partOfSpeech": "sustantivo",
    "meaning": "Animal que vive en el agua y nada usando sus aletas y cola."
  },
  "peces": {
    "word": "peces",
    "displayWord": "Peces",
    "partOfSpeech": "sustantivo",
    "meaning": "Varios animales acuáticos nadando en el río o el mar."
  },
  "caballo": {
    "word": "caballo",
    "displayWord": "Caballo",
    "partOfSpeech": "sustantivo",
    "meaning": "Animal grande, fuerte y veloz con crin y cola larga que ayuda en el campo."
  },
  "conejo": {
    "word": "conejo",
    "displayWord": "Conejo",
    "partOfSpeech": "sustantivo",
    "meaning": "Animal pequeño y rápido con orejas largas y cola de pompón al que le gustan las zanahorias."
  },
  "mariposa": {
    "word": "mariposa",
    "displayWord": "Mariposa",
    "partOfSpeech": "sustantivo",
    "meaning": "Insecto volador con alas grandes de hermosos colores que revolotea entre las flores."
  },
  "león": {
    "word": "león",
    "displayWord": "León",
    "partOfSpeech": "sustantivo",
    "meaning": "Gran felino de la sabana con majestuosa melena, conocido como el rey de los animales."
  },
  "oso": {
    "word": "oso",
    "displayWord": "Oso",
    "partOfSpeech": "sustantivo",
    "meaning": "Mamífero grande y fuerte con pelaje grueso que vive en bosques y montañas."
  },
  "casa": {
    "word": "casa",
    "displayWord": "Casa",
    "partOfSpeech": "sustantivo",
    "meaning": "Lugar donde vive una familia, con paredes, techo y habitaciones para descansar y compartir.",
    "example": "Nuestra casa es un hogar lleno de amor."
  },
  "hogar": {
    "word": "hogar",
    "displayWord": "Hogar",
    "partOfSpeech": "sustantivo",
    "meaning": "Lugar donde una persona o familia habita con calidez, seguridad y cariño."
  },
  "puerta": {
    "word": "puerta",
    "displayWord": "Puerta",
    "partOfSpeech": "sustantivo",
    "meaning": "Abertura con un panel móvil que permite entrar o salir de una casa o habitación."
  },
  "ventana": {
    "word": "ventana",
    "displayWord": "Ventana",
    "partOfSpeech": "sustantivo",
    "meaning": "Abertura en la pared con cristal para dejar entrar la luz del sol y el aire fresco."
  },
  "cama": {
    "word": "cama",
    "displayWord": "Cama",
    "partOfSpeech": "sustantivo",
    "meaning": "Mueble con colchón, sábanas y almohada donde nos acostamos para dormir y soñar."
  },
  "mesa": {
    "word": "mesa",
    "displayWord": "Mesa",
    "partOfSpeech": "sustantivo",
    "meaning": "Mueble con una superficie plana sostenida por patas para comer, dibujar o estudiar."
  },
  "silla": {
    "word": "silla",
    "displayWord": "Silla",
    "partOfSpeech": "sustantivo",
    "meaning": "Mueble con asiento y respaldo diseñado para sentarse cómodamente."
  },
  "comida": {
    "word": "comida",
    "displayWord": "Comida",
    "partOfSpeech": "sustantivo",
    "meaning": "Alimento nutritivo que comemos para crecer fuertes y tener energía todo el día."
  },
  "pan": {
    "word": "pan",
    "displayWord": "Pan",
    "partOfSpeech": "sustantivo",
    "meaning": "Alimento básico y delicioso horneado a base de harina, agua y levadura."
  },
  "leche": {
    "word": "leche",
    "displayWord": "Leche",
    "partOfSpeech": "sustantivo",
    "meaning": "Bebida blanca, nutritiva y rica en calcio que ayuda a tener huesos fuertes."
  },
  "manzana": {
    "word": "manzana",
    "displayWord": "Manzana",
    "partOfSpeech": "sustantivo",
    "meaning": "Fruta redonda de color rojo, verde o amarillo, dulce, jugosa y crujiente."
  },
  "juguete": {
    "word": "juguete",
    "displayWord": "Juguete",
    "partOfSpeech": "sustantivo",
    "meaning": "Objeto con el que los niños juegan para divertirse e inventar historias."
  },
  "pelota": {
    "word": "pelota",
    "displayWord": "Pelota",
    "partOfSpeech": "sustantivo",
    "meaning": "Objeto redondo y elástico que rebota y se usa en muchos juegos divertidos."
  },
  "camino": {
    "word": "camino",
    "displayWord": "Camino",
    "partOfSpeech": "sustantivo",
    "meaning": "Vía o sendero por donde se camina o viaja de un lugar a otro."
  },
  "calle": {
    "word": "calle",
    "displayWord": "Calle",
    "partOfSpeech": "sustantivo",
    "meaning": "Vía en un pueblo o ciudad flanqueada por casas y aceras para transitar."
  },
  "ciudad": {
    "word": "ciudad",
    "displayWord": "Ciudad",
    "partOfSpeech": "sustantivo",
    "meaning": "Población grande con muchas casas, edificios, calles, parques y tiendas."
  },
  "pueblo": {
    "word": "pueblo",
    "displayWord": "Pueblo",
    "partOfSpeech": "sustantivo",
    "meaning": "Comunidad o población pequeña con vida tranquila y vecinal."
  },
  "jugar": {
    "word": "jugar",
    "displayWord": "Jugar",
    "partOfSpeech": "verbo",
    "meaning": "Hacer una actividad divertida por entretenimiento o juego con amigos o juguetes.",
    "example": "A los niños les encanta jugar en el recreo."
  },
  "aprender": {
    "word": "aprender",
    "displayWord": "Aprender",
    "partOfSpeech": "verbo",
    "meaning": "Adquirir nuevos conocimientos, destrezas o habilidades mediante el estudio y la práctica.",
    "example": "Leyendo aprendemos cosas fascinantes."
  },
  "leer": {
    "word": "leer",
    "displayWord": "Leer",
    "partOfSpeech": "verbo",
    "meaning": "Comprender e interpretar las palabras escritas para descubrir una historia.",
    "example": "Me gusta leer antes de ir a dormir."
  },
  "escribir": {
    "word": "escribir",
    "displayWord": "Escribir",
    "partOfSpeech": "verbo",
    "meaning": "Trazar letras y signos en el papel para comunicar pensamientos o mensajes."
  },
  "cantar": {
    "word": "cantar",
    "displayWord": "Cantar",
    "partOfSpeech": "verbo",
    "meaning": "Emitir sonidos melodiosos con la voz formando canciones agradables."
  },
  "bailar": {
    "word": "bailar",
    "displayWord": "Bailar",
    "partOfSpeech": "verbo",
    "meaning": "Mover el cuerpo al ritmo de la música con alegría."
  },
  "reír": {
    "word": "reír",
    "displayWord": "Reír",
    "partOfSpeech": "verbo",
    "meaning": "Manifestar alegría con sonidos y gestos risueños en el rostro."
  },
  "sonreír": {
    "word": "sonreír",
    "displayWord": "Sonreír",
    "partOfSpeech": "verbo",
    "meaning": "Hacer una sonrisa amable que demuestra felicidad y cariño hacia los demás."
  },
  "correr": {
    "word": "correr",
    "displayWord": "Correr",
    "partOfSpeech": "verbo",
    "meaning": "Avanzar a gran velocidad dando zancadas rápidas con los pies."
  },
  "caminar": {
    "word": "caminar",
    "displayWord": "Caminar",
    "partOfSpeech": "verbo",
    "meaning": "Avanzar dando pasos con tranquilidad disfrutando del paseo."
  },
  "saltar": {
    "word": "saltar",
    "displayWord": "Saltar",
    "partOfSpeech": "verbo",
    "meaning": "Elevarse del suelo con un impulso ágil de las piernas."
  },
  "volar": {
    "word": "volar",
    "displayWord": "Volar",
    "partOfSpeech": "verbo",
    "meaning": "Desplazarse libremente por el aire usando las alas."
  },
  "nadar": {
    "word": "nadar",
    "displayWord": "Nadar",
    "partOfSpeech": "verbo",
    "meaning": "Avanzar en el agua usando los brazos y las piernas."
  },
  "hablar": {
    "word": "hablar",
    "displayWord": "Hablar",
    "partOfSpeech": "verbo",
    "meaning": "Comunicarse con otros pronunciando palabras con la voz."
  },
  "escuchar": {
    "word": "escuchar",
    "displayWord": "Escuchar",
    "partOfSpeech": "verbo",
    "meaning": "Prestar atención con los oídos a lo que se oye o a lo que nos dicen."
  },
  "mirar": {
    "word": "mirar",
    "displayWord": "Mirar",
    "partOfSpeech": "verbo",
    "meaning": "Dirigir la vista hacia algo para observarlo con atención."
  },
  "ver": {
    "word": "ver",
    "displayWord": "Ver",
    "partOfSpeech": "verbo",
    "meaning": "Percibir por medio de los ojos las figuras y colores del entorno."
  },
  "buscar": {
    "word": "buscar",
    "displayWord": "Buscar",
    "partOfSpeech": "verbo",
    "meaning": "Hacer acciones para encontrar a una persona o cosa que queremos ver."
  },
  "encontrar": {
    "word": "encontrar",
    "displayWord": "Encontrar",
    "partOfSpeech": "verbo",
    "meaning": "Dar con lo que se estaba buscando o descubrir algo sorprendente."
  },
  "ayudar": {
    "word": "ayudar",
    "displayWord": "Ayudar",
    "partOfSpeech": "verbo",
    "meaning": "Prestar apoyo y colaboración a alguien para facilitarle una tarea.",
    "example": "Nos gusta ayudar a mamá en casa."
  },
  "querer": {
    "word": "querer",
    "displayWord": "Querer",
    "partOfSpeech": "verbo",
    "meaning": "Tener cariño, aprecio o desear algo bueno con ilusión."
  },
  "amar": {
    "word": "amar",
    "displayWord": "Amar",
    "partOfSpeech": "verbo",
    "meaning": "Sentir un amor y cariño muy profundo hacia la familia y los amigos."
  },
  "compartir": {
    "word": "compartir",
    "displayWord": "Compartir",
    "partOfSpeech": "verbo",
    "meaning": "Repartir o disfrutar juntos de un juguete, alimento o momento feliz."
  },
  "soñar": {
    "word": "soñar",
    "displayWord": "Soñar",
    "partOfSpeech": "verbo",
    "meaning": "Imaginar historias hermosas mientras se duerme o desear algo con esperanza."
  },
  "dormir": {
    "word": "dormir",
    "displayWord": "Dormir",
    "partOfSpeech": "verbo",
    "meaning": "Descansar plácidamente con los ojos cerrados para recargar energía."
  },
  "despertar": {
    "word": "despertar",
    "displayWord": "Despertar",
    "partOfSpeech": "verbo",
    "meaning": "Salir del sueño y abrir los ojos al iniciar un nuevo día."
  },
  "comer": {
    "word": "comer",
    "displayWord": "Comer",
    "partOfSpeech": "verbo",
    "meaning": "Masticar y tragar alimentos saludables para nutrir el cuerpo."
  },
  "vivir": {
    "word": "vivir",
    "displayWord": "Vivir",
    "partOfSpeech": "verbo",
    "meaning": "Tener vida, habitar un lugar y disfrutar de las experiencias del día."
  },
  "ser": {
    "word": "ser",
    "displayWord": "Ser",
    "partOfSpeech": "verbo",
    "meaning": "Verbo que define la esencia, identidad y cualidades de algo o alguien."
  },
  "estar": {
    "word": "estar",
    "displayWord": "Estar",
    "partOfSpeech": "verbo",
    "meaning": "Indica la ubicación, estado de ánimo o condición en un momento dado."
  },
  "tener": {
    "word": "tener",
    "displayWord": "Tener",
    "partOfSpeech": "verbo",
    "meaning": "Poseer algo o sentir una emoción como alegría, calma o curiosidad."
  },
  "hacer": {
    "word": "hacer",
    "displayWord": "Hacer",
    "partOfSpeech": "verbo",
    "meaning": "Realizar, construir, dibujar o llevar a cabo una actividad."
  },
  "ir": {
    "word": "ir",
    "displayWord": "Ir",
    "partOfSpeech": "verbo",
    "meaning": "Moverse o viajar de un lugar hacia otro."
  },
  "venir": {
    "word": "venir",
    "displayWord": "Venir",
    "partOfSpeech": "verbo",
    "meaning": "Avanzar o trasladarse hacia donde nos encontramos."
  },
  "decir": {
    "word": "decir",
    "displayWord": "Decir",
    "partOfSpeech": "verbo",
    "meaning": "Expresar ideas o palabras con la voz."
  },
  "feliz": {
    "word": "feliz",
    "displayWord": "Feliz",
    "partOfSpeech": "adjetivo",
    "meaning": "Que siente mucha alegría, contento y satisfacción en su corazón.",
    "example": "El niño estaba muy feliz con su libro nuevo."
  },
  "alegre": {
    "word": "alegre",
    "displayWord": "Alegre",
    "partOfSpeech": "adjetivo",
    "meaning": "Lleno de entusiasmo, risas y buen humor."
  },
  "contento": {
    "word": "contento",
    "displayWord": "Contento",
    "partOfSpeech": "adjetivo",
    "meaning": "Que se siente satisfecho y tranquilo con lo que tiene o vive."
  },
  "triste": {
    "word": "triste",
    "displayWord": "Triste",
    "partOfSpeech": "adjetivo",
    "meaning": "Que siente pena o desánimo y necesita comprensión y un abrazo amigo."
  },
  "bueno": {
    "word": "bueno",
    "displayWord": "Bueno",
    "partOfSpeech": "adjetivo",
    "meaning": "Que tiene bondad en su corazón, actúa de forma correcta y ayuda a los demás."
  },
  "grande": {
    "word": "grande",
    "displayWord": "Grande",
    "partOfSpeech": "adjetivo",
    "meaning": "De tamaño considerable o superior al promedio."
  },
  "pequeño": {
    "word": "pequeño",
    "displayWord": "Pequeño",
    "partOfSpeech": "adjetivo",
    "meaning": "De tamaño reducido o de corta edad; chiquito y tierno."
  },
  "lindo": {
    "word": "lindo",
    "displayWord": "Lindo",
    "partOfSpeech": "adjetivo",
    "meaning": "Hermoso, agradable y bonito a la vista o de trato tierno."
  },
  "hermoso": {
    "word": "hermoso",
    "displayWord": "Hermoso",
    "partOfSpeech": "adjetivo",
    "meaning": "Que tiene gran belleza y despierta admiración y deleite."
  },
  "bonito": {
    "word": "bonito",
    "displayWord": "Bonito",
    "partOfSpeech": "adjetivo",
    "meaning": "Agradable y gracioso a la vista."
  },
  "fuerte": {
    "word": "fuerte",
    "displayWord": "Fuerte",
    "partOfSpeech": "adjetivo",
    "meaning": "Que tiene vigor, energía, resistencia y gran capacidad para salir adelante."
  },
  "rápido": {
    "word": "rápido",
    "displayWord": "Rápido",
    "partOfSpeech": "adjetivo / adverbio",
    "meaning": "Que se mueve velozmente o sucede en muy poco tiempo."
  },
  "lento": {
    "word": "lento",
    "displayWord": "Lento",
    "partOfSpeech": "adjetivo",
    "meaning": "Que se mueve despacio o toma su tiempo con calma."
  },
  "mágico": {
    "word": "mágico",
    "displayWord": "Mágico",
    "partOfSpeech": "adjetivo",
    "meaning": "Que tiene poderes fantásticos, misteriosos o maravillosos como en los cuentos de hadas.",
    "example": "El libro mágico abrió una puerta secreta."
  },
  "brillante": {
    "word": "brillante",
    "displayWord": "Brillante",
    "partOfSpeech": "adjetivo",
    "meaning": "Que emite mucha luz resplandeciente o destaca por su gran inteligencia."
  },
  "nuevo": {
    "word": "nuevo",
    "displayWord": "Nuevo",
    "partOfSpeech": "adjetivo",
    "meaning": "Que se ha estrenado recientemente o que no se conocía antes."
  },
  "dulce": {
    "word": "dulce",
    "displayWord": "Dulce",
    "partOfSpeech": "adjetivo",
    "meaning": "De sabor azucarado y agradable, o de carácter cariñoso y suave."
  },
  "suave": {
    "word": "suave",
    "displayWord": "Suave",
    "partOfSpeech": "adjetivo",
    "meaning": "Agradable y delicado al tocarlo, sin asperezas, como el pelaje de un conejo."
  },
  "rojo": {
    "word": "rojo",
    "displayWord": "Rojo",
    "partOfSpeech": "adjetivo / color",
    "meaning": "Color cálido y llamativo como el de las fresas, manzanas o el corazón."
  },
  "azul": {
    "word": "azul",
    "displayWord": "Azul",
    "partOfSpeech": "adjetivo / color",
    "meaning": "Color sereno como el del cielo despejado o las aguas profundas del mar."
  },
  "verde": {
    "word": "verde",
    "displayWord": "Verde",
    "partOfSpeech": "adjetivo / color",
    "meaning": "Color natural y fresco como el de las hojas de los árboles y los valles."
  },
  "amarillo": {
    "word": "amarillo",
    "displayWord": "Amarillo",
    "partOfSpeech": "adjetivo / color",
    "meaning": "Color luminoso y alegre como los rayos del sol o los girasoles."
  },
  "blanco": {
    "word": "blanco",
    "displayWord": "Blanco",
    "partOfSpeech": "adjetivo / color",
    "meaning": "Color claro y limpio como la nieve, las nubes o la leche."
  },
  "negro": {
    "word": "negro",
    "displayWord": "Negro",
    "partOfSpeech": "adjetivo / color",
    "meaning": "Color oscuro como la noche estrellada."
  },
  "cat": {
    "word": "cat",
    "displayWord": "Cat",
    "partOfSpeech": "sustantivo",
    "meaning": "Gato. Animal doméstico pequeño, curioso y ágil con bigotes y cola, al que le encanta jugar y ronronear.",
    "example": "The cat likes to play."
  },
  "dog": {
    "word": "dog",
    "displayWord": "Dog",
    "partOfSpeech": "sustantivo",
    "meaning": "Perro. Animal fiel y cariñoso de cuatro patas, conocido como el mejor amigo de las personas.",
    "example": "The dog wags its tail."
  },
  "tree": {
    "word": "tree",
    "displayWord": "Tree",
    "partOfSpeech": "sustantivo",
    "meaning": "Árbol. Planta grande y fuerte con un tronco leñoso, ramas y muchas hojas verdes que dan sombra.",
    "example": "The magic tree is tall."
  },
  "bird": {
    "word": "bird",
    "displayWord": "Bird",
    "partOfSpeech": "sustantivo",
    "meaning": "Pájaro o ave. Animal con plumas y alas que canta alegremente y vuela en el cielo."
  },
  "fish": {
    "word": "fish",
    "displayWord": "Fish",
    "partOfSpeech": "sustantivo",
    "meaning": "Pez. Animal acuático que nada libremente en ríos, lagos y mares usando sus aletas."
  },
  "sun": {
    "word": "sun",
    "displayWord": "Sun",
    "partOfSpeech": "sustantivo",
    "meaning": "Sol. Gran estrella brillante y cálida que alumbra nuestro día y da energía a las plantas."
  },
  "water": {
    "word": "water",
    "displayWord": "Water",
    "partOfSpeech": "sustantivo",
    "meaning": "Agua. Líquido transparente y refrescante esencial para beber, jugar y para toda la naturaleza."
  },
  "flower": {
    "word": "flower",
    "displayWord": "Flower",
    "partOfSpeech": "sustantivo",
    "meaning": "Flor. Parte colorida y hermosa de las plantas que llena de vida los jardines."
  },
  "moon": {
    "word": "moon",
    "displayWord": "Moon",
    "partOfSpeech": "sustantivo",
    "meaning": "Luna. Astro brillante en el cielo nocturno que nos acompaña cuando descansamos."
  },
  "star": {
    "word": "star",
    "displayWord": "Star",
    "partOfSpeech": "sustantivo",
    "meaning": "Estrella. Pequeña luz brillante en el cielo nocturno que parece titilar."
  },
  "rain": {
    "word": "rain",
    "displayWord": "Rain",
    "partOfSpeech": "sustantivo",
    "meaning": "Lluvia. Gotitas de agua fresca que caen de las nubes para ayudar a crecer a las plantas."
  },
  "forest": {
    "word": "forest",
    "displayWord": "Forest",
    "partOfSpeech": "sustantivo",
    "meaning": "Bosque. Gran extensión llena de árboles y caminos donde viven muchos animales."
  },
  "book": {
    "word": "book",
    "displayWord": "Book",
    "partOfSpeech": "sustantivo",
    "meaning": "Libro. Conjunto de páginas con historias, letras y dibujos para descubrir el mundo."
  },
  "school": {
    "word": "school",
    "displayWord": "School",
    "partOfSpeech": "sustantivo",
    "meaning": "Escuela. Lugar especial donde aprendemos con maestros y amigos."
  },
  "teacher": {
    "word": "teacher",
    "displayWord": "Teacher",
    "partOfSpeech": "sustantivo",
    "meaning": "Maestro o maestra. Persona amable que nos guía y enseña cosas nuevas con paciencia."
  },
  "friend": {
    "word": "friend",
    "displayWord": "Friend",
    "partOfSpeech": "sustantivo",
    "meaning": "Amigo o amiga. Compañero con quien compartimos risas, juegos y confianza."
  },
  "house": {
    "word": "house",
    "displayWord": "House",
    "partOfSpeech": "sustantivo",
    "meaning": "Casa. Hogar donde vivimos protegidos y contentos con nuestra familia."
  },
  "home": {
    "word": "home",
    "displayWord": "Home",
    "partOfSpeech": "sustantivo",
    "meaning": "Hogar. Lugar lleno de cariño donde compartimos con quienes más queremos."
  },
  "family": {
    "word": "family",
    "displayWord": "Family",
    "partOfSpeech": "sustantivo",
    "meaning": "Familia. Las personas que nos cuidan, apoyan y aman todos los días."
  },
  "mother": {
    "word": "mother",
    "displayWord": "Mother",
    "partOfSpeech": "sustantivo",
    "meaning": "Madre o mamá. Quien nos brinda amor, abrazos y cuidado constante."
  },
  "father": {
    "word": "father",
    "displayWord": "Father",
    "partOfSpeech": "sustantivo",
    "meaning": "Padre o papá. Quien nos acompaña con cariño y protección."
  },
  "play": {
    "word": "play",
    "displayWord": "Play",
    "partOfSpeech": "verbo",
    "meaning": "Jugar. Divertirse haciendo juegos, deportes o inventando aventuras.",
    "example": "We play with our friends."
  },
  "learn": {
    "word": "learn",
    "displayWord": "Learn",
    "partOfSpeech": "verbo",
    "meaning": "Aprender. Descubrir ideas y habilidades nuevas que nos hacen crecer."
  },
  "read": {
    "word": "read",
    "displayWord": "Read",
    "partOfSpeech": "verbo",
    "meaning": "Leer. Recorrer con los ojos las palabras escritas para imaginar una historia."
  },
  "write": {
    "word": "write",
    "displayWord": "Write",
    "partOfSpeech": "verbo",
    "meaning": "Escribir. Trazar letras y palabras para expresar lo que pensamos y sentimos."
  },
  "sing": {
    "word": "sing",
    "displayWord": "Sing",
    "partOfSpeech": "verbo",
    "meaning": "Cantar. Entonar canciones bonitas con nuestra voz."
  },
  "dance": {
    "word": "dance",
    "displayWord": "Dance",
    "partOfSpeech": "verbo",
    "meaning": "Bailar. Mover el cuerpo al compás de la música con ritmo y alegría."
  },
  "happy": {
    "word": "happy",
    "displayWord": "Happy",
    "partOfSpeech": "adjetivo",
    "meaning": "Feliz o alegre. Sentimiento de dicha, sonrisa y bienestar en el corazón."
  },
  "good": {
    "word": "good",
    "displayWord": "Good",
    "partOfSpeech": "adjetivo",
    "meaning": "Bueno o bien. Que hace el bien, agrada y ayuda a los demás."
  },
  "big": {
    "word": "big",
    "displayWord": "Big",
    "partOfSpeech": "adjetivo",
    "meaning": "Grande. De tamaño mayor o de gran importancia."
  },
  "little": {
    "word": "little",
    "displayWord": "Little",
    "partOfSpeech": "adjetivo",
    "meaning": "Pequeño o chiquito. De tamaño tierno y reducido."
  }
};
