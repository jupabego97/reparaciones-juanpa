import os
import base64
import subprocess
import tempfile
import hashlib
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ImageService:
    def __init__(self):
        # Directorio temporal para las imágenes
        self.temp_dir = Path(tempfile.gettempdir()) / "repair_images"
        self.temp_dir.mkdir(exist_ok=True)
        
    def compress_image(self, base64_image: str, max_width: int = 800, quality: int = 2) -> str:
        """
        Comprime una imagen en base64 usando ffmpeg
        
        Args:
            base64_image: Imagen en formato base64
            max_width: Ancho máximo de la imagen comprimida
            quality: Calidad de compresión (1-31, menor es mejor calidad)
        
        Returns:
            Imagen comprimida en formato base64
        """
        try:
            # Extraer el tipo de imagen y los datos en base64
            if not base64_image.startswith('data:'):
                raise ValueError('Formato de imagen inválido')
            
            # Separar header y datos
            header, image_data = base64_image.split(',', 1)
            
            # Extraer tipo de imagen
            image_type = header.split(';')[0].split(':')[1]
            
            # Generar nombres de archivo únicos
            unique_id = hashlib.md5(image_data.encode()).hexdigest()[:16]
            input_path = self.temp_dir / f"{unique_id}_input.jpg"
            output_path = self.temp_dir / f"{unique_id}_output.jpg"
            
            try:
                # Guardar imagen original
                with open(input_path, 'wb') as f:
                    f.write(base64.b64decode(image_data))
                
                # Comprimir la imagen con ffmpeg
                cmd = [
                    'ffmpeg',
                    '-i', str(input_path),
                    '-vf', f'scale={max_width}:-1',
                    '-q:v', str(quality),
                    '-y',  # Sobrescribir archivo de salida
                    str(output_path)
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode != 0:
                    logger.error(f"Error en ffmpeg: {result.stderr}")
                    raise subprocess.CalledProcessError(result.returncode, cmd, result.stderr)
                
                # Leer imagen comprimida
                with open(output_path, 'rb') as f:
                    compressed_data = f.read()
                
                compressed_base64 = f"data:{image_type};base64,{base64.b64encode(compressed_data).decode()}"
                
                # Log de compresión
                original_size = len(base64_image)
                compressed_size = len(compressed_base64)
                compression_ratio = (1 - compressed_size / original_size) * 100
                
                logger.info(f"Imagen comprimida: Original={original_size} bytes, "
                           f"Comprimida={compressed_size} bytes, "
                           f"Reducción={compression_ratio:.1f}%")
                
                return compressed_base64
                
            finally:
                # Limpiar archivos temporales
                for file_path in [input_path, output_path]:
                    if file_path.exists():
                        file_path.unlink()
                        
        except Exception as error:
            logger.error(f"Error al comprimir la imagen: {error}")
            # Si falla la compresión, devolver la imagen original
            return base64_image
    
    def is_base64_image(self, data: str) -> bool:
        """
        Verifica si una cadena es una imagen base64 válida
        """
        try:
            if not data.startswith('data:image/'):
                return False
            
            header, image_data = data.split(',', 1)
            
            # Intentar decodificar
            base64.b64decode(image_data, validate=True)
            return True
            
        except Exception:
            return False
    
    def get_image_info(self, base64_image: str) -> dict:
        """
        Obtiene información básica de una imagen base64
        """
        try:
            if not self.is_base64_image(base64_image):
                return {}
            
            header, image_data = base64_image.split(',', 1)
            image_type = header.split(';')[0].split(':')[1]
            
            # Calcular tamaño aproximado en bytes
            size_bytes = len(base64_image)
            
            return {
                'type': image_type,
                'size_bytes': size_bytes,
                'size_kb': round(size_bytes / 1024, 2),
                'is_large': size_bytes > 500000  # Mayor a 500KB
            }
            
        except Exception as error:
            logger.error(f"Error obteniendo info de imagen: {error}")
            return {}
    
    def cleanup_temp_files(self):
        """
        Limpia archivos temporales antiguos
        """
        try:
            import time
            current_time = time.time()
            
            for file_path in self.temp_dir.glob("*"):
                if file_path.is_file():
                    # Eliminar archivos más antiguos de 1 hora
                    if current_time - file_path.stat().st_mtime > 3600:
                        file_path.unlink()
                        logger.info(f"Archivo temporal eliminado: {file_path}")
                        
        except Exception as error:
            logger.error(f"Error limpiando archivos temporales: {error}")

# Intentar usar FFmpeg, si no está disponible usar Pillow como fallback
def get_image_service():
    """
    Obtiene el servicio de imágenes apropiado según las dependencias disponibles
    """
    import subprocess
    
    try:
        # Verificar si FFmpeg está disponible
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, 
                              timeout=5)
        if result.returncode == 0:
            print("✅ FFmpeg disponible, usando ImageService")
            return ImageService()
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # Fallback a Pillow
    try:
        from .image_service_pillow import ImageServicePillow
        print("⚠️  FFmpeg no disponible, usando Pillow como fallback")
        return ImageServicePillow()
    except ImportError:
        print("❌ Ni FFmpeg ni Pillow están disponibles")
        return None

# Instancia global del servicio
image_service = get_image_service()
