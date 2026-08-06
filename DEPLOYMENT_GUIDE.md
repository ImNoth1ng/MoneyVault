# 🚀 Guía de Despliegue en Ubuntu Server para MoneyVault

Esta guía te explica paso a paso cómo desplegar la aplicación completa (**Frontend + Backend + Base de Datos**) en tu servidor Ubuntu usando **Docker** y **Docker Compose**.

---

## 🔒 ¿Por qué este sistema no chocará con tus otros servicios?

1. **Base de Datos Aislada**: MySQL corre dentro de un contenedor en una red virtual privada de Docker (`moneyvault-net`). No utiliza ni choca con el puerto 3306 de tu servidor ni afecta a otras bases de datos existentes.
2. **Puerto Web Personalizable**: Puedes elegir cualquier puerto libre en tu servidor (por ejemplo, `8888`, `9090`, `7777`, etc.) editando el archivo `.env`.

---

## 🛠️ Paso 1: Preparar tu Servidor Ubuntu (Solo si aún no tienes Docker)

Conéctate a tu servidor Ubuntu por SSH e instala Docker y Docker Compose:

```bash
# 1. Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker y el plugin de Docker Compose
sudo apt install -y docker.io docker-compose-v2

# 3. Iniciar el servicio de Docker y habilitarlo para que arranque con el sistema
sudo systemctl enable --now docker

# 4. (Opcional) Permitir ejecutar docker sin 'sudo' (requiere reiniciar sesión después)
sudo usermod -aG docker $USER
```

---

## 📁 Paso 2: Copiar el Proyecto a tu Servidor

Puedes subir este proyecto a tu servidor usando **Git** (recomendado) o mediante **SFTP / FileZilla / SCP**.

### Opción A (Vía Git):
```bash
cd ~
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git moneyvault
cd moneyvault
```

### Opción B (Vía SCP desde tu computadora):
```bash
# Ejecutar en tu terminal local
scp -r "c:/Users/xGud/Documents/Proyectos/Finanazas-Java" usuario@IP_DE_TU_SERVIDOR:~/moneyvault
```

---

## ⚙️ Paso 3: Configurar el Puerto y Variables (`.env`)

Dentro de la carpeta del proyecto en tu servidor Ubuntu, abre el archivo `.env`:

```bash
cd ~/moneyvault
nano .env
```

Verás las siguientes variables principales:

```env
# Cambia este número por el puerto libre que quieras usar en tu servidor
APP_PORT=8888

# Opcional: Puerto para acceder al Swagger UI directamente
BACKEND_PORT=8085

# Contraseñas de Base de Datos
MYSQL_PASSWORD=TuContrasenaSegura2026!
MYSQL_ROOT_PASSWORD=TuRootPasswordSegura2026!
```

> 💡 **Para guardar en Nano**: Presiona `Ctrl + O`, luego `Enter` y después `Ctrl + X` para salir.

---

## 🚀 Paso 4: Iniciar la Aplicación en Contenedores

Ejecuta el siguiente comando para construir e iniciar todos los servicios en segundo plano:

```bash
sudo docker compose up --build -d
```

Este proceso:
1. Compilará el Backend Java (Spring Boot) en una imagen liviana.
2. Compilará el Frontend React y lo empaquetará con Nginx.
3. Descargará y configurará la base de datos MySQL 8.
4. Iniciará los 3 contenedores conectados en su propia red privada.

---

## ✅ Paso 5: Verificar el Estado de la Aplicación

Para comprobar que todo está corriendo correctamente:

```bash
# Ver el estado de los contenedores
sudo docker compose ps

# Ver los logs en tiempo real para verificar que arrancó correctamente
sudo docker compose logs -f
```

*(Para salir de los logs, presiona `Ctrl + C`).*

---

## 🌐 Paso 6: Acceder a tu Aplicación

Abre tu navegador web y navega a la IP de tu servidor Ubuntu usando el puerto que configuraste en `APP_PORT`:

```text
http://TU_IP_DEL_SERVIDOR:8888
```

*(Por ejemplo: `http://192.168.1.100:8888` o `http://tu-dominio.com:8888`)*

---

## 🛠️ Comandos de Mantenimiento Útiles

- **Detener la aplicación**:
  ```bash
  sudo docker compose down
  ```
- **Reiniciar la aplicación**:
  ```bash
  sudo docker compose restart
  ```
- **Ver los logs de un servicio específico** (ej: backend o frontend):
  ```bash
  sudo docker compose logs -f finanzas-api
  sudo docker compose logs -f finanzas-ui
  ```
- **Recompilar después de hacer cambios en el código**:
  ```bash
  sudo docker compose up --build -d
  ```
