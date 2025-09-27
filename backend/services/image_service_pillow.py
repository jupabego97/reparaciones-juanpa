import os
import base64
import tempfile
import hashlib
from pathlib import Path
from typing import Optional, Tuple
import logging
from PIL import Image, ImageOps
import io

logger = logging.getLogger(__name__)

class ImageServicePillow:
    def __init__(self):
        # Directorio temporal para las imágenes
        self.temp_dir = Path(tempfile.gettempdir()) / "repair_images"
        self.temp_dir.mkdir(exist_ok=True)
        
    def compress_image(self, base64_image: str, max_width: int = 800, quality: int = 85) -> str:
        """
        Comprime una imagen en base64 usando Pillow
        
        Args:
            base64_image: Imagen en formato base64
            max_width: Ancho máximo de la imagen comprimida
            quality: Calidad de compresión JPEG (1-100, mayor es mejor calidad)
        
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
            
            # Decodificar imagen
            image_bytes = base64.b64decode(image_data)
            
            # Abrir imagen con Pillow
            with Image.open(io.BytesIO(image_bytes)) as img:
                # Convertir a RGB si es necesario (para JPEG)
                if img.mode in ('RGBA', 'P', 'LA'):
                    # Crear fondo blanco para transparencias
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Redimensionar si es necesario
                original_width, original_height = img.size
                if original_width > max_width:
                    # Calcular nueva altura manteniendo proporción
                    new_height = int((max_width * original_height) / original_width)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Aplicar optimización automática de orientación
                img = ImageOps.exif_transpose(img)
                
                # Comprimir y guardar en buffer
                output_buffer = io.BytesIO()
                
                # Usar formato JPEG para mejor compresión
                img.save(
                    output_buffer, 
                    format='JPEG',
                    quality=quality,
                    optimize=True,
                    progressive=True
                )
                
                # Obtener datos comprimidos
                compressed_data = output_buffer.getvalue()
                compressed_base64 = f"data:image/jpeg;base64,{base64.b64encode(compressed_data).decode()}"
                
                # Log de compresión
                original_size = len(base64_image)
                compressed_size = len(compressed_base64)
                compression_ratio = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0
                
                logger.info(f"Imagen comprimida con Pillow: Original={original_size} bytes, "
                           f"Comprimida={compressed_size} bytes, "
                           f"Reducción={compression_ratio:.1f}%")
                
                return compressed_base64
                
        except Exception as error:
            logger.error(f"Error al comprimir la imagen con Pillow: {error}")
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
            
            # Verificar longitud mínima (imágenes muy cortas probablemente están truncadas)
            if len(image_data) < 100:  # Muy corto para ser una imagen real
                logger.warning(f"Imagen base64 muy corta: {len(image_data)} caracteres")
                return False
            
            # Intentar decodificar
            decoded_data = base64.b64decode(image_data, validate=True)
            
            # Verificar que los datos decodificados tengan un tamaño razonable
            if len(decoded_data) < 50:  # Muy pequeño para ser una imagen real
                logger.warning(f"Datos de imagen muy pequeños: {len(decoded_data)} bytes")
                return False
            
            # Intentar abrir la imagen para verificar que es válida
            try:
                with Image.open(io.BytesIO(decoded_data)) as img:
                    # Verificar que la imagen tiene dimensiones válidas
                    width, height = img.size
                    if width < 1 or height < 1:
                        logger.warning(f"Dimensiones inválidas: {width}x{height}")
                        return False
                    
                    return True
            except Exception as img_error:
                logger.warning(f"Error abriendo imagen: {img_error}")
                return False
            
        except Exception as e:
            logger.warning(f"Error validando imagen base64: {e}")
            return False
    
    def get_image_info(self, base64_image: str) -> dict:
        """
        Obtiene información detallada de una imagen base64
        """
        try:
            if not self.is_base64_image(base64_image):
                return {}
            
            header, image_data = base64_image.split(',', 1)
            image_type = header.split(';')[0].split(':')[1]
            
            # Calcular tamaño en bytes
            size_bytes = len(base64_image)
            
            # Obtener dimensiones de la imagen
            try:
                image_bytes = base64.b64decode(image_data)
                with Image.open(io.BytesIO(image_bytes)) as img:
                    width, height = img.size
                    format_name = img.format
                    mode = img.mode
            except Exception as e:
                logger.warning(f"No se pudieron obtener dimensiones de imagen: {e}")
                width = height = format_name = mode = None
            
            return {
                'type': image_type,
                'format': format_name,
                'mode': mode,
                'width': width,
                'height': height,
                'size_bytes': size_bytes,
                'size_kb': round(size_bytes / 1024, 2),
                'size_mb': round(size_bytes / 1024 / 1024, 2),
                'is_large': size_bytes > 500000,  # Mayor a 500KB
                'dimensions': f"{width}x{height}" if width and height else None
            }
            
        except Exception as error:
            logger.error(f"Error obteniendo info de imagen: {error}")
            return {}
    
    def create_thumbnail(self, base64_image: str, size: Tuple[int, int] = (150, 150)) -> str:
        """
        Crea una miniatura de la imagen
        
        Args:
            base64_image: Imagen en formato base64
            size: Tupla (width, height) para el tamaño de la miniatura
        
        Returns:
            Miniatura en formato base64
        """
        try:
            if not self.is_base64_image(base64_image):
                raise ValueError('Formato de imagen inválido')
            
            header, image_data = base64_image.split(',', 1)
            image_bytes = base64.b64decode(image_data)
            
            with Image.open(io.BytesIO(image_bytes)) as img:
                # Convertir a RGB si es necesario
                if img.mode in ('RGBA', 'P', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Crear miniatura manteniendo proporción
                img.thumbnail(size, Image.Resampling.LANCZOS)
                
                # Guardar en buffer
                output_buffer = io.BytesIO()
                img.save(output_buffer, format='JPEG', quality=90, optimize=True)
                
                # Convertir a base64
                thumbnail_data = output_buffer.getvalue()
                thumbnail_base64 = f"data:image/jpeg;base64,{base64.b64encode(thumbnail_data).decode()}"
                
                return thumbnail_base64
                
        except Exception as error:
            logger.error(f"Error creando miniatura: {error}")
            return base64_image
    
    def create_placeholder_image(self, text: str = "Sin Imagen", size: Tuple[int, int] = (400, 300), 
                               bg_color: Tuple[int, int, int] = (240, 240, 240),
                               text_color: Tuple[int, int, int] = (128, 128, 128)) -> str:
        """
        Crea una imagen placeholder con texto
        
        Args:
            text: Texto a mostrar en el placeholder
            size: Tupla (width, height) para el tamaño de la imagen
            bg_color: Color de fondo RGB
            text_color: Color del texto RGB
        
        Returns:
            Imagen placeholder en formato base64
        """
        try:
            from PIL import ImageDraw, ImageFont
            
            # Crear imagen con fondo
            img = Image.new('RGB', size, bg_color)
            draw = ImageDraw.Draw(img)
            
            # Intentar usar una fuente del sistema
            font = None
            try:
                # Intentar fuentes comunes del sistema
                font_paths = [
                    "arial.ttf",
                    "Arial.ttf", 
                    "/System/Library/Fonts/Arial.ttf",  # macOS
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
                    "C:/Windows/Fonts/arial.ttf",  # Windows
                ]
                
                for font_path in font_paths:
                    try:
                        font = ImageFont.truetype(font_path, 24)
                        break
                    except:
                        continue
                        
                if not font:
                    font = ImageFont.load_default()
                    
            except Exception:
                font = ImageFont.load_default()
            
            # Calcular posición del texto (centrado)
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (size[0] - text_width) // 2
            y = (size[1] - text_height) // 2
            
            # Dibujar el texto
            draw.text((x, y), text, fill=text_color, font=font)
            
            # Agregar un borde sutil
            draw.rectangle([0, 0, size[0]-1, size[1]-1], outline=(200, 200, 200), width=2)
            
            # Convertir a base64
            output_buffer = io.BytesIO()
            img.save(output_buffer, format='JPEG', quality=90)
            
            image_data = output_buffer.getvalue()
            placeholder_base64 = f"data:image/jpeg;base64,{base64.b64encode(image_data).decode()}"
            
            return placeholder_base64
            
        except Exception as error:
            logger.error(f"Error creando imagen placeholder: {error}")
            # Retornar un placeholder mínimo si falla todo
            return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzgwODA4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVxdWlwbyBzaW4gaW1hZ2VuPC90ZXh0Pjwvc3ZnPg=="
    
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

# Instancia global del servicio
image_service_pillow = ImageServicePillow()
