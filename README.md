# Slither English Multiplayer

Juego multijugador tipo Slither para practicar vocabulario de ingles en clase. Los estudiantes pueden entrar con su nombre, elegir color, competir individualmente o por equipos, escuchar pronunciacion, atrapar vocabulario y evitar peligros.

## Caracteristicas

- Multijugador en tiempo real con Socket.IO.
- Nombre, color y equipo por estudiante.
- Modos `Practice`, `Battle` y `Teams`.
- Serpientes CPU en `Practice` cuando hay un solo jugador.
- Vocabulario de frutas, verduras, objetos del salon, animales, colores y acciones.
- Pronunciacion solo para el jugador local; otros eventos usan sonido de punto.
- Objetos peligrosos que quitan puntos o eliminan temporalmente.
- Boost de velocidad manteniendo click o toque.
- Boton de pausa sin reiniciar puntajes.
- Retos aleatorios por equipos en modo `Teams`.

## Requisitos

- Node.js 18 o superior.
- npm.

## Ejecutar Localmente

Instalar dependencias:

```bash
npm install
```

Iniciar servidor:

```bash
npm start
```

Abrir en el navegador:

```text
http://localhost:3000
```

Para jugar en clase desde la misma red Wi-Fi, usa la URL local que aparece en consola, por ejemplo:

```text
http://192.168.1.25:3000
```

## Controles

- Mover mouse o dedo: dirigir serpiente.
- Mantener click o toque: boost de velocidad.
- `Pause`: pausar o continuar sin perder puntaje.
- `Repeat`: repetir la ultima palabra del jugador local.
- `Settings` o `Esc`: volver a configuracion.
- `P`: pausar o continuar.

## Modos

- `Practice`: modo tranquilo para practicar. Si juega una sola persona, aparecen serpientes CPU.
- `Battle`: competencia directa con colisiones.
- `Teams`: competencia por equipos con retos aleatorios.

## Despliegue En Fly.io

### 1. Instalar Fly CLI

Documentacion oficial:

```text
https://fly.io/docs/flyctl/install/
```

Verificar instalacion:

```bash
fly version
```

### 2. Iniciar sesion

```bash
fly auth login
```

### 3. Crear App En Fly.io

El archivo `fly.toml` ya esta incluido. El nombre configurado es:

```text
slither-english
```

Si ese nombre ya esta ocupado, cambia `app = "slither-english"` en `fly.toml` por otro nombre unico.

Crear la app usando la configuracion existente:

```bash
fly apps create slither-english
```

Si usas otro nombre, usa ese nombre tambien en el comando.

### 4. Desplegar

```bash
fly deploy
```

### 5. Abrir La App

```bash
fly open
```

O usar la URL:

```text
https://slither-english.fly.dev
```

## Configuracion De Fly.io

La app escucha en el puerto interno `3000`.

Fly.io expone la aplicacion por HTTPS automaticamente.

Socket.IO funciona sobre la misma URL publica de Fly.io.

## Archivos Importantes

- `server.js`: servidor Express + Socket.IO y logica autoritativa del juego.
- `public/index.html`: interfaz principal.
- `public/game.js`: render canvas, inputs, sockets y audio del cliente.
- `public/styles.css`: estilos de la interfaz.
- `fly.toml`: configuracion de despliegue en Fly.io.
- `Dockerfile`: imagen de produccion para Fly.io.
- `PLAN_MULTIPLAYER.md`: plan tecnico y reglas del juego.

## Notas

- Para una clase local sin internet, sigue usando `npm start` en la computadora del profesor.
- Para acceso publico por internet, usa Fly.io.
- Si cambias el nombre de la app en Fly.io, actualiza tambien `fly.toml`.
