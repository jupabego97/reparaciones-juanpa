#!/usr/bin/env python3
import psycopg2
from psycopg2.extras import RealDictCursor
import json

def extract_neon_data():
    conn_string = 'postgresql://neondb_owner:npg_bHhnZ40Guitw@ep-sweet-credit-a4d5y8f1.us-east-1.aws.neon.tech/neondb?sslmode=require'

    try:
        print('🔍 Conectando a Neon...')
        conn = psycopg2.connect(conn_string)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Verificar si existe la tabla repair_cards
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'repair_cards';
        """)
        table_exists = cur.fetchone()

        if table_exists:
            print('✅ Tabla repair_cards encontrada en Neon')

            # Contar registros
            cur.execute('SELECT COUNT(*) as count FROM repair_cards')
            count_result = cur.fetchone()
            total_records = count_result['count']
            print(f'📊 Total de registros: {total_records}')

            if total_records > 0:
                # Extraer todos los registros
                cur.execute('SELECT * FROM repair_cards ORDER BY created_at DESC')
                records = cur.fetchall()

                print('\n📝 Extrayendo registros...')

                # Convertir a formato JSON serializable
                extracted_data = []
                for record in records:
                    # Convertir objetos datetime y decimal a tipos serializables
                    clean_record = {}
                    for key, value in record.items():
                        if hasattr(value, 'isoformat'):  # datetime objects
                            clean_record[key] = value.isoformat()
                        elif hasattr(value, '__float__'):  # decimal objects
                            clean_record[key] = float(value)
                        else:
                            clean_record[key] = value
                    extracted_data.append(clean_record)

                # Guardar en archivo JSON
                with open('neon_repair_cards_backup.json', 'w', encoding='utf-8') as f:
                    json.dump(extracted_data, f, indent=2, ensure_ascii=False)

                print(f'✅ {len(extracted_data)} registros extraídos y guardados en neon_repair_cards_backup.json')

                # Mostrar primeros 3 registros como ejemplo
                print('\n📋 Primeros 3 registros:')
                for i, record in enumerate(extracted_data[:3], 1):
                    print(f'\n--- Registro {i} ---')
                    print(f'ID: {record.get("id")}')
                    print(f'Cliente: {record.get("owner_name")}')
                    print(f'Problema: {record.get("problem_type")}')
                    print(f'Estado: {record.get("status")}')
                    print(f'Creado: {record.get("created_at")}')

                return extracted_data
            else:
                print('⚠️ La tabla está vacía')
                return []
        else:
            print('❌ La tabla repair_cards no existe en Neon')

            # Ver qué tablas existen
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cur.fetchall()
            print('📋 Tablas disponibles:')
            for table in tables:
                print(f'  - {table["table_name"]}')

        cur.close()
        conn.close()

    except Exception as e:
        print(f'❌ Error conectando a Neon: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    extract_neon_data()
