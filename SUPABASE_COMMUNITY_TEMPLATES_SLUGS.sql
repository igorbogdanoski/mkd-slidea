-- Community template SEO slugs — македонска кирилица → латиница транслитерација.
-- Idempotent. Ги регенерира slug-овите од насловот за убави, SEO-пријателски URL-а
-- (пр. „Теорија на бои“ → "teorija-na-boi") наместо UUID backfill.
--
-- Безбедно: менува САМО slug вредности. Detail страниците претходно беа скршени
-- (нема slug колона), па ниту еден постоечки линк не се потпира на старите UUID slug-ови.
-- Supersedes само го slug-generation делот од SUPABASE_COMMUNITY_TEMPLATES.sql.

SET client_encoding = 'UTF8';

-- 1) Транслитерација (македонска кирилица → латиница), immutable за индексирање.
CREATE OR REPLACE FUNCTION public.transliterate_mk(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := LOWER(COALESCE(input, ''));
  map text[][] := ARRAY[
    ['а','a'],['б','b'],['в','v'],['г','g'],['д','d'],['ѓ','gj'],['е','e'],
    ['ж','zh'],['з','z'],['ѕ','dz'],['и','i'],['ј','j'],['к','k'],['л','l'],
    ['љ','lj'],['м','m'],['н','n'],['њ','nj'],['о','o'],['п','p'],['р','r'],
    ['с','s'],['т','t'],['ќ','kj'],['у','u'],['ф','f'],['х','h'],['ц','c'],
    ['ч','ch'],['џ','dzh'],['ш','sh']
  ];
  pair text[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY map LOOP
    result := REPLACE(result, pair[1], pair[2]);
  END LOOP;
  result := REGEXP_REPLACE(result, '[^a-z0-9]+', '-', 'g');
  result := TRIM(BOTH '-' FROM result);
  RETURN result;
END;
$$;

-- 2) Авто-slug тригерот сега транслитерира (идните темплејти добиваат убави slug-ови).
CREATE OR REPLACE FUNCTION public.community_templates_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base text;
  candidate text;
  suffix integer := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := public.transliterate_mk(NEW.title);
    IF base = '' THEN base := NEW.id::text; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.community_templates WHERE slug = candidate AND id <> NEW.id) LOOP
      suffix := suffix + 1;
      candidate := base || '-' || suffix;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 3) Еднократна регенерација за постоечките редови (тригерот пушта по ред, со unique-check).
UPDATE public.community_templates SET slug = NULL;
