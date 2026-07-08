// ============================================================
//  MISTURADOR AVANÇADO — mod para Sandboxels
//  Autor: você + Claude :)
// ------------------------------------------------------------
//  COMO INSTALAR:
//  1. Abra o Sandboxels (sandboxels.r74n.com ou sua cópia local).
//  2. Clique em "Mods" na barra de ferramentas.
//  3. Se estiver hospedando este arquivo online, cole a URL completa
//     (ex: link do GitHub "raw"). Se estiver jogando localmente,
//     coloque este arquivo na pasta /mods/ e digite o nome do
//     arquivo: misturador_avancado.js
//  4. Aperte Enter e recarregue a página.
//
//  COMO FUNCIONA:
//  O Misturador é um bloco sólido (tipo parede). Ele fica de olho
//  nas 3 células logo acima dele. Se dois ingredientes DIFERENTES
//  caírem ali e existir uma receita cadastrada pra essa combinação,
//  os dois são consumidos e o resultado da mistura sai por baixo do
//  bloco. Se não houver receita pra aquela combinação, os itens
//  simplesmente ficam empilhados em cima — NADA passa. É por isso
//  que ele é "melhor" que o misturador original: aquele só borra as
//  cores dos sólidos que tocam nele, sem se importar se faz sentido
//  químico. Este aqui só deixa passar o que realmente reage/mistura.
// ============================================================

(function () {

  // ---------- Funções auxiliares de baixo nível ----------
  // Não dependemos de helpers que podem não existir em toda versão;
  // usamos pixelMap/pixels diretamente, que são o "chão" da engine.

  function sbxGetPixel(x, y) {
    if (x < 0 || y < 0 || typeof pixelMap[x] === "undefined" || typeof pixelMap[x][y] === "undefined") return null;
    var idx = pixelMap[x][y];
    if (idx === -1 || idx === null || typeof pixels[idx] === "undefined") return null;
    return pixels[idx];
  }

  function sbxIsEmpty(x, y) {
    if (x < 0 || y < 0 || typeof pixelMap[x] === "undefined" || typeof pixelMap[x][y] === "undefined") return false;
    var idx = pixelMap[x][y];
    return idx === -1 || idx === null || typeof pixels[idx] === "undefined";
  }

  // ---------- Sistema de receitas ----------
  // Guardamos as receitas num objeto, com chave = ingredientes em
  // ordem alfabética separados por "+". Assim "sand+water" e
  // "water+sand" apontam pra mesma receita.

  var misturadorRecipes = {};

  function addMixerRecipe(elemA, elemB, resultado) {
    var chave = [elemA, elemB].sort().join("+");
    misturadorRecipes[chave] = resultado;
  }

  function getMixerRecipe(elemA, elemB) {
    var chave = [elemA, elemB].sort().join("+");
    return misturadorRecipes[chave] || null;
  }

  // Deixa a função disponível globalmente, assim você (ou outros mods)
  // pode adicionar mais receitas depois, ex:
  // addMixerRecipe("leite", "morango", "milkshake");
  window.addMixerRecipe = addMixerRecipe;

  // Receitas padrão de exemplo (edite/apague/adicione à vontade).
  // Se um dos elementos não existir na sua versão do jogo, a receita
  // simplesmente nunca vai disparar — não quebra nada.
  addMixerRecipe("water", "salt", "salt_water");
  addMixerRecipe("water", "sugar", "sugar_water");
  addMixerRecipe("water", "sand", "wet_sand");
  addMixerRecipe("water", "dirt", "mud");
  addMixerRecipe("water", "cement", "concrete");
  addMixerRecipe("water", "lava", "obsidian");

  // ---------- O elemento em si ----------

  elements.misturador = {
    name: "Misturador",
    category: "machines",
    color: ["#5a5a5a", "#6e6e6e", "#4d4d4d"],
    behavior: behaviors.WALL,
    state: "solid",
    density: 4000,
    hardness: 1,
    conduct: 0.3,
    tempHigh: 2200,
    stateHigh: "lava",
    desc: "Só solta a mistura se dois ingredientes diferentes formarem uma receita válida. Se não combinarem, ficam presos em cima — nada passa por acidente.",

    tick: function (pixel) {
      // Só faz alguma coisa se a saída (embaixo) estiver livre
      if (!sbxIsEmpty(pixel.x, pixel.y + 1)) return;

      // Olha as 3 células logo acima do misturador (esquerda, centro, direita)
      var achados = {};
      for (var dx = -1; dx <= 1; dx++) {
        var p = sbxGetPixel(pixel.x + dx, pixel.y - 1);
        if (p && p.element !== "empty" && p.element !== "misturador") {
          if (!achados[p.element]) achados[p.element] = [];
          achados[p.element].push(p);
        }
      }

      var tipos = Object.keys(achados);
      if (tipos.length < 2) return; // precisa de pelo menos 2 ingredientes diferentes

      // Testa cada combinação possível dos ingredientes encontrados
      for (var i = 0; i < tipos.length; i++) {
        for (var j = i + 1; j < tipos.length; j++) {
          var resultado = getMixerRecipe(tipos[i], tipos[j]);
          if (resultado && elements[resultado]) {
            var pixelA = achados[tipos[i]][0];
            var pixelB = achados[tipos[j]][0];

            // Consome os dois ingredientes
            changePixel(pixelA, "empty");
            changePixel(pixelB, "empty");

            // Libera o resultado por baixo do misturador
            createPixel(resultado, pixel.x, pixel.y + 1);

            // Um pequeno aquecimento pra dar "vida" ao processo (opcional)
            pixel.temp = (pixel.temp || 20) + 2;
            return;
          }
        }
      }
      // Se chegou aqui, os ingredientes não combinam entre si —
      // eles continuam parados em cima do bloco, sem passar.
    }
  };

})();
