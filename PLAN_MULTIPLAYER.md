# Plan De Mejora: Slither English Multiplayer

## Objetivo

Convertir el juego actual de Slither English en una aplicacion multijugador local para clases de ingles, donde varios estudiantes puedan competir desde sus navegadores usando la misma red Wi-Fi.

El profesor ejecuta la aplicacion en su computadora y los estudiantes ingresan desde sus dispositivos.

## Estado Actual

El proyecto original tiene un unico archivo:

- `fruit_slither_battle_enemies.html`

Este archivo contiene HTML, CSS, logica del juego, canvas, enemigos IA, vocabulario de frutas, ranking local y pronunciacion con `speechSynthesis`.

## Arquitectura Implementada

La nueva version usa Node.js, Express y Socket.IO.

Estructura:

```text
slither_english/
├── package.json
├── server.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── game.js
├── PLAN_MULTIPLAYER.md
└── fruit_slither_battle_enemies.html
```

## Tecnologias

- Node.js
- Express
- Socket.IO
- HTML Canvas
- JavaScript vanilla
- Web Speech API

## Uso En Clase

Instalar dependencias:

```bash
npm install
```

Iniciar servidor:

```bash
npm start
```

El profesor comparte la URL local que aparece en consola, por ejemplo:

```text
http://192.168.1.25:3000
```

## Funcionalidades

### Pantalla De Entrada

Cada estudiante puede:

- Escribir su nombre.
- Elegir color de serpiente.
- Elegir equipo.
- Elegir modo inicial.
- Entrar a la partida.

### Multijugador En Tiempo Real

El servidor sincroniza:

- Jugadores conectados.
- Posiciones.
- Segmentos de serpientes.
- Puntajes.
- Longitudes.
- Objetos de vocabulario.
- Ranking.
- Estado de colision y reaparicion.

### Servidor Autoritativo

El servidor controla el estado principal del juego para evitar que cada navegador tenga una version distinta.

Responsabilidades del servidor:

- Crear jugadores.
- Validar nombres y colores.
- Mover serpientes.
- Generar vocabulario.
- Detectar comida.
- Detectar colisiones.
- Calcular ranking.
- Manejar desconexiones.

### Vocabulario Ampliado

Categorias incluidas:

- Fruits
- Vegetables
- Classroom
- Animals
- Colors
- Actions

Cada objeto tiene:

```js
{
  emoji: "🍎",
  en: "Apple",
  es: "Manzana",
  category: "Fruits",
  color: "#ef4444",
  article: "an"
}
```

### Modos De Juego

#### Practice

Modo mas lento, ideal para aprender vocabulario. No aplica colisiones competitivas entre estudiantes.

#### Battle

Modo competitivo con colisiones entre serpientes y penalizacion al chocar.

#### Teams

Modo competitivo por equipos. Muestra puntajes individuales y puntajes por equipo.

### Feedback Educativo

Cuando un estudiante come un objeto:

- Se muestra el emoji.
- Se muestra la palabra en ingles.
- Se muestra la traduccion al espanol.
- Se muestra la categoria.
- Se reproduce la pronunciacion en ingles.
- Se muestra una frase de clase.

Ejemplos:

```text
Ana ate an apple!
Carlos learned: Run!
```

### Objetos Peligrosos

El mapa tambien incluye objetos que los estudiantes deben evitar.

Tipos iniciales:

- `Bomb`: elimina temporalmente al jugador y provoca reaparicion.
- `Poison`: elimina temporalmente al jugador y provoca reaparicion.
- `Virus`: quita puntos y longitud.
- `Rock`: quita puntos y longitud.
- `Hot Pepper`: quita pocos puntos y longitud.

Estos objetos se sincronizan por Socket.IO para que todos vean los mismos peligros.

### Bots En Practice Solo

Cuando el modo es `Practice` y solo hay un estudiante humano conectado, el servidor crea serpientes CPU automaticamente.

Comportamiento:

- Aparecen en posiciones aleatorias.
- Buscan objetos de vocabulario cercanos.
- Evitan peligros cercanos.
- Compiten en el ranking.
- Desaparecen si entra otro estudiante humano o si se cambia a `Battle` o `Teams`.

### Acorralar Serpientes

La mecanica de choques permite acorralar serpientes.

Regla:

- Si la cabeza de una serpiente choca contra el cuerpo de otra, la serpiente que choca queda eliminada temporalmente.
- La serpiente que provoco el choque roba parte de los puntos de la serpiente eliminada.
- La serpiente eliminada reaparece con `0` puntos y su longitud inicial.
- En `Practice` esta mecanica funciona contra serpientes CPU.
- En `Battle` y `Teams` funciona entre jugadores humanos y bots si existen.

### Pausa Sin Reiniciar Puntajes

La partida puede pausarse con el boton `Pause` o con la tecla `P`.

Durante la pausa:

- No se mueven jugadores ni bots.
- No se comen objetos.
- No se activan peligros.
- No se recalculan choques.
- Los puntajes y longitudes se conservan.

### Boost De Velocidad

El jugador puede hacer boost manteniendo presionado el click o tocando la pantalla.

Reglas:

- Aumenta temporalmente la velocidad.
- Consume una parte de la longitud de la serpiente.
- No puede reducir la serpiente por debajo de un minimo seguro.
- Muestra una llama visual detras de la cabeza.

### Retos Aleatorios Por Equipos

En modo `Teams`, el servidor crea retos aleatorios para ganar rondas.

Ejemplo:

```text
Catch 5 Apples
Catch 4 Pencils
Catch 6 Dogs
```

Reglas:

- El reto elige un objeto o fruta al azar.
- El reto define una cantidad objetivo aleatoria.
- Cada equipo suma progreso cuando uno de sus jugadores come el objeto correcto.
- El primer equipo que completa la cantidad gana la ronda.
- Los miembros del equipo ganador reciben puntos extra y longitud extra.
- Luego se genera automaticamente un nuevo reto.

## Eventos Socket.IO

Cliente a servidor:

- `joinGame`
- `playerInput`
- `setMode`
- `disconnect`

Servidor a cliente:

- `welcome`
- `joined`
- `gameState`
- `foodEaten`
- `playerCrashed`
- `classMessage`

## Criterios De Exito

- El profesor puede ejecutar `npm start`.
- Los estudiantes pueden entrar desde la misma red Wi-Fi.
- Cada estudiante puede escribir su nombre.
- Cada estudiante puede elegir color.
- Todos ven a todos en tiempo real.
- El ranking se actualiza en tiempo real.
- Los objetos de vocabulario aparecen en el mapa compartido.
- Al comer un objeto, todos ven y escuchan la palabra en ingles.
- Hay modos Practice, Battle y Teams.

## Mejoras Futuras

- Panel dedicado del profesor en `/teacher`.
- Temporizador por rondas.
- Filtro por categoria de vocabulario.
- Preguntas de opcion multiple al comer objetos.
- Exportar ranking final.
- Codigos de sala para varias clases simultaneas.
