# Temas de exposición – Complejidad Computacional

Página estática (GitHub Pages) + Supabase (plan gratuito) para que los alumnos elijan tema sin cuenta de GitHub. Cada tema solo puede ser elegido una vez y cada correo solo puede elegir un tema; ambas reglas las garantiza la base de datos.

## Puesta en marcha

1. Crear un proyecto en <https://supabase.com> (plan gratuito).
2. En *SQL Editor* pegar y ejecutar [supabase/schema.sql](supabase/schema.sql).
3. En *Project Settings → API* copiar la *Project URL* y la clave `anon` y pegarlas en [config.js](config.js). La clave `anon` es pública por diseño: la tabla `claims` no es legible con ella, solo se puede consultar qué temas están ocupados y registrar una elección.
4. Subir el repo a GitHub y activar *Settings → Pages → Deploy from a branch → main / (root)*.

## Administración

- Ver quién eligió qué: *Table Editor → claims* en Supabase.
- Liberar un tema o permitir un cambio: borrar la fila correspondiente.
- Agregar o editar temas: modificar [topics.json](topics.json) (`id` único en minúsculas, dígitos y guiones).

## Limitaciones

- El correo no se verifica; cualquiera podría registrar un correo ajeno. Revisa la tabla contra la lista del grupo.
- Los temas se validan solo por formato de `id` en el servidor.
