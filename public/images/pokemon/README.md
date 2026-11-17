# Companheiros Pokémon

Sprites PNG distribuídos pelo [PokéAPI/sprites](https://github.com/PokeAPI/sprites), pasta `sprites/pokemon`. Pokémon e os personagens pertencem à Nintendo, Creatures e GAME FREAK. Os sprites de gerações posteriores no estilo pixel também incluem contribuições da comunidade, creditadas no repositório de origem.

Os 54 arquivos (27 normais e 27 shiny da pasta `sprites/pokemon/shiny` da mesma fonte) são servidos localmente; o site não depende da API nem de um CDN de imagens. Para atualizar: `node scripts/fetch-pokemon.mjs`. Os sprites são recortados pelo mesmo processo, com dimensões próprias para cada variante.

O botão **Versão shiny** em Extras troca a paleta dos cartões, da linha evolutiva, da animação de evolução e do companheiro na barra, no hanabi e no taiko. A preferência fica salva separadamente em `oku-pet-shiny`, preservando a escolha e a forma existentes em `oku-pets`.

No menu Extras, escolha um dos três iniciais de cada região (Kanto, Hoenn ou Kalos). Apenas um acompanha a visita. Ele evolui nos Projetos e chega à forma final no Contato ou em 99% do percurso. A forma fica salva em `oku-pets`, nunca regride e a troca de inicial começa uma nova jornada. O hanabi e o modo foto não concedem evolução ao mover a câmera.
