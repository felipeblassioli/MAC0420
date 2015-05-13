Nome: Felipe Anez de ToledoBlassioli
NUSP: 7991050

# Observacoes

Selecionar objeto apertando TAB

# Estrutura do projeto

- main.js: ponto de entrada da aplicao.
- renderes.js: Classe principal. Para a lista de obj carregados, os renderiza. Possui o codigo da Camera para determinar ViewMatrix e ProjectionMatrix
- control.js: configura os listeners dos eventos de teclado e mouse.
- trackball: Faz a interseccao com o hemispherio e possibita obter matriz de rotacao.
- objReader.js: essencialmente o mesmo do ep1. Carrega obj.
- utils.js: matematica. Possui quarternio e multiplicacao desses.
- geometry:
  
  - model.js: classe base de algo renderizavel
  - triangle_mesh.js: model que renderiza triangulos
  - box.js: bouding box de um model e a renderizacao de seu wireframe
  - manipulators: TranslationManipulator corresponde ao conjunto de eixos de um model.

# O que falta

- Rotacao de modelo nao obdece selecao de eixos
- Selecao de objetos por clique (eh feita apertando TAB)