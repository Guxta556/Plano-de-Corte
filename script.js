let sheetWidth = 100; // em cm
let sheetHeight = 100; // em cm
let cuts = [];
let ctx;
const CM_TO_PX = 10; // Conversão de centímetros para pixels

document.addEventListener("DOMContentLoaded", function() {
  ctx = document.getElementById('canvas').getContext('2d');
});

// Função para adicionar um novo recorte
function addCut() {
  let cutName = document.getElementById('cut-name').value;
  let cutLength = parseFloat(document.getElementById('cut-length').value);
  let cutWidth = parseFloat(document.getElementById('cut-width').value);
  let cutQuantity = parseInt(document.getElementById('cut-quantity').value);
  let cutColor = document.getElementById('cut-color').value;
  let borderTape = document.getElementById('border-tape').checked;
  let selectedBorders = [];
  document.querySelectorAll('.border-selector div.selected').forEach(div => {
    selectedBorders.push(div.getAttribute('data-border'));
  });

  for (let i = 0; i < cutQuantity; i++) {
    cuts.push({ name: cutName, length: cutLength, width: cutWidth, color: cutColor, borderTape, borders: selectedBorders });
  }

  updateCutList();
}

// Função para atualizar a lista de recortes
function updateCutList() {
  let cutList = document.getElementById('cut-list');
  cutList.innerHTML = '';

  cuts.forEach((cut) => {
    let listItem = document.createElement('li');
    listItem.textContent = `${cut.name} - ${cut.length}x${cut.width} - ${cut.color} - ${cut.borderTape ? 'Fita de Borda' : 'Sem Fita de Borda'} - Bordas: ${cut.borders.join(', ')}`;
    cutList.appendChild(listItem);
  });
}

// Atualizar a função de organização dos recortes para considerar a espessura da serra
function organizeCuts() {
  // Ordenar os recortes por área decrescente
  cuts.sort((a, b) => b.length * b.width - a.length * a.width);

  let occupiedSpaces = [];
  let totalCutArea = 0;
  let totalBorderLength = 0;
  let sawThickness = parseFloat(document.getElementById('saw-thickness').value) || 0;
  let useSawThickness = document.getElementById('use-saw-thickness').checked;

  // Inicializar a posição do recorte atual
  for (let cut of cuts) {
    let position = findPositionForCut(cut, occupiedSpaces);
    if (position) {
      drawCut(position.x, position.y, cut.length, cut.width, cut.name, cut.color, cut.borderTape, cut.borders, useSawThickness, sawThickness);
      totalCutArea += cut.length * cut.width;
      occupiedSpaces.push({ 
        x: position.x, 
        y: position.y, 
        width: cut.length + (useSawThickness ? sawThickness : 0), 
        height: cut.width + (useSawThickness ? sawThickness : 0) 
      });

      if (cut.borderTape) {
        for (let border of cut.borders) {
          switch (border) {
            case 'top':
            case 'bottom':
              totalBorderLength += cut.length;
              break;
            case 'left':
            case 'right':
              totalBorderLength += cut.width;
              break;
          }
        }
      }
    } else {
      alert(`Não há espaço na chapa para o recorte ${cut.name} considerando a espessura da serra!`);
    }
  }

  let totalRemainingArea = (sheetWidth * sheetHeight) - totalCutArea;
  return { totalCutArea, totalRemainingArea, totalBorderLength };
}

// Função para encontrar a posição para o recorte
function findPositionForCut(cut, occupiedSpaces) {
    // Ajuste a tolerância para compensar erros de arredondamento e precisão
    const tolerance = 0.1; // Tolerância mínima para o ajuste de posições

    // Adicione uma margem de segurança
    const margin = 0.01; // Margem para garantir que o recorte caiba

    for (let y = 0; y <= sheetHeight - cut.width + margin; y += tolerance) {
      for (let x = 0; x <= sheetWidth - cut.length + margin; x += tolerance) {
        if (isPositionValid(x, y, cut.length, cut.width, occupiedSpaces)) {
          return { x: x, y: y, rotated: false };
        } else if (isPositionValid(x, y, cut.width, cut.length, occupiedSpaces)) {
          // Tentar a rotação
          return { x: x, y: y, rotated: true };
        }
      }
    }
    return null;
  }

  // Função para verificar se a posição é válida
  function isPositionValid(x, y, cutLength, cutWidth, occupiedSpaces) {
    for (let space of occupiedSpaces) {
      if (!(x + cutLength <= space.x ||
            x >= space.x + space.width ||
            y + cutWidth <= space.y ||
            y >= space.y + space.height)) {
        return false;
      }
    }
    return true;
  }


// Atualizar a função de desenho do recorte para considerar a espessura da serra
function drawCut(x, y, length, width, name, color, borderTape, borders, useSawThickness, sawThickness) {
  let adjustedLength = length * CM_TO_PX;
  let adjustedWidth = width * CM_TO_PX;

  if (useSawThickness && sawThickness !== 0) {
    adjustedLength -= sawThickness * CM_TO_PX;
    adjustedWidth -= sawThickness * CM_TO_PX;
  }

  ctx.fillStyle = color;
  ctx.fillRect(x * CM_TO_PX, y * CM_TO_PX, adjustedLength, adjustedWidth);

  // Adicionar texto com nome e medidas
  ctx.fillStyle = 'black';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let text = `${name}\n${length}x${width} cm`;
  let textX = x * CM_TO_PX + adjustedLength / 2;
  let textY = y * CM_TO_PX + adjustedWidth / 2;
  wrapText(ctx, text, textX, textY, adjustedLength);

  if (borderTape) {
    ctx.strokeStyle = 'red';  // Cor da borda
    ctx.lineWidth = sawThickness * CM_TO_PX; // Converte cm para pixels

    borders.forEach(border => {
      switch (border) {
        case 'top':
          ctx.beginPath();
          ctx.moveTo(x * CM_TO_PX, y * CM_TO_PX);
          ctx.lineTo(x * CM_TO_PX + adjustedLength, y * CM_TO_PX);
          ctx.stroke();
          break;
        case 'right':
          ctx.beginPath();
          ctx.moveTo(x * CM_TO_PX + adjustedLength, y * CM_TO_PX);
          ctx.lineTo(x * CM_TO_PX + adjustedLength, y * CM_TO_PX + adjustedWidth);
          ctx.stroke();
          break;
        case 'bottom':
          ctx.beginPath();
          ctx.moveTo(x * CM_TO_PX + adjustedLength, y * CM_TO_PX + adjustedWidth);
          ctx.lineTo(x * CM_TO_PX, y * CM_TO_PX + adjustedWidth);
          ctx.stroke();
          break;
        case 'left':
          ctx.beginPath();
          ctx.moveTo(x * CM_TO_PX, y * CM_TO_PX + adjustedWidth);
          ctx.lineTo(x * CM_TO_PX, y * CM_TO_PX);
          ctx.stroke();
          break;
      }
    });
  }
}

// Função para configurar o seletor de bordas
function setupBorderSelector() {
  const borderSelector = document.getElementById('border-selector');
  const borderTapeCheckbox = document.getElementById('border-tape');

  borderTapeCheckbox.addEventListener('change', (e) => {
    borderSelector.style.display = e.target.checked ? 'flex' : 'none';
  });

  borderSelector.addEventListener('click', (e) => {
    if (e.target.dataset.border) {
      const border = e.target.dataset.border;
      const isSelected = e.target.classList.toggle('selected');

      if (isSelected) {
        addBorderTape();
      } else {
        const cutName = document.getElementById('cut-name').value;
        borderTapes[cutName].delete(border);
        updateBorderSelectorStyles();
      }
    }
  });
}

// Função para adicionar fita de borda
function addBorderTape() {
  const cutName = document.getElementById('cut-name').value;
  const border = document.getElementById('border-selector').querySelector('.selected').dataset.border;

  if (!borderTapes[cutName]) {
    borderTapes[cutName] = new Set();
  }

  borderTapes[cutName].add(border);

  updateBorderSelectorStyles();
}

// Função para calcular o comprimento total da fita de borda
function calculateTotalBorderTapeLength() {
  let totalLength = 0;

  for (let cut of cuts) {
    const borders = borderTapes[cut.name] || new Set();
    let length = 0;

    // Calcula o comprimento da fita de borda para o recorte atual
    if (borders.has('top')) length += cut.length;
    if (borders.has('bottom')) length += cut.length;
    if (borders.has('left')) length += cut.width;
    if (borders.has('right')) length += cut.width;

    borderTapeLengths[cut.name] = length;
    totalLength += length;
  }

  return totalLength;
}


// Configura os eventos dos botões
document.getElementById('add-item').addEventListener('click', addCut);
document.getElementById('cutting-form').addEventListener('submit', (e) => {
  e.preventDefault();
  sheetWidth = parseFloat(document.getElementById('sheet-width').value);
  sheetHeight = parseFloat(document.getElementById('sheet-height').value);
  document.getElementById('canvas').width = sheetWidth * CM_TO_PX;
  document.getElementById('canvas').height = sheetHeight * CM_TO_PX;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'gray';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  organizeCuts();
});

// Adicionar evento de click ao botão "Baixar Plano e Relatório"
document.getElementById('download').addEventListener('click', generateReportAndDownload);

// Chame a função de configuração do seletor de bordas
setupBorderSelector();



// Atualizar a função de organização dos recortes para considerar a espessura da serra
function organizeCuts() {
    // Ordenar os recortes por área decrescente
    cuts.sort((a, b) => b.length * b.width - a.length * a.width);
  
    let occupiedSpaces = [];
    let totalCutArea = 0;
    let totalBorderLength = 0;
    let sawThickness = parseFloat(document.getElementById('saw-thickness').value) || 0;
    let useSawThickness = document.getElementById('use-saw-thickness').checked;
  
    // Inicializar a posição do recorte atual
    for (let cut of cuts) {
      let position = findPositionForCut(cut, occupiedSpaces);
      if (position) {
        drawCut(position.x, position.y, cut.length, cut.width, cut.name, cut.color, cut.borderTape, cut.borders, useSawThickness, sawThickness);
        totalCutArea += cut.length * cut.width;
        occupiedSpaces.push({ 
          x: position.x, 
          y: position.y, 
          width: cut.length + (useSawThickness ? sawThickness : 0), 
          height: cut.width + (useSawThickness ? sawThickness : 0) 
        });
        
        if (cut.borderTape) {
          for (let border of cut.borders) {
            switch (border) {
              case 'top':
              case 'bottom':
                totalBorderLength += cut.length;
                break;
              case 'left':
              case 'right':
                totalBorderLength += cut.width;
                break;
            }
          }
        }
      } else {
        alert(`Não há espaço na chapa para o recorte ${cut.name} considerando a espessura da borda!`);
      }
    }
  
    let totalRemainingArea = (sheetWidth * sheetHeight) - totalCutArea;
    return { totalCutArea, totalRemainingArea, totalBorderLength };
  }
  
  // Atualizar a função de desenho do recorte para considerar a espessura da serra
  function drawCut(x, y, length, width, name, color, borderTape, borders, useSawThickness, sawThickness) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CM_TO_PX, y * CM_TO_PX, length * CM_TO_PX, width * CM_TO_PX);

    drawRuler();
  
    if (borderTape) {
      ctx.strokeStyle = 'red';  // Cor da borda
      ctx.lineWidth = borderThickness * CM_TO_PX; // Converte cm para pixels
      ctx.strokeRect(x * CM_TO_PX, y * CM_TO_PX, length * CM_TO_PX, width * CM_TO_PX);
  
      if (useSawThickness && sawThickness !== 0) {
        ctx.strokeStyle = 'red'; // Cor do espaço da serra
        ctx.lineWidth = sawThickness * CM_TO_PX; // Converte cm para pixels
        
        // Adicionar o espaço entre os recortes
        ctx.strokeRect(x * CM_TO_PX - sawThickness * CM_TO_PX / 2, y * CM_TO_PX - sawThickness * CM_TO_PX / 2, length * CM_TO_PX + sawThickness * CM_TO_PX, width * CM_TO_PX + sawThickness * CM_TO_PX);
      }
    }
  }
  

  // Função para atualizar a lista de recortes
function updateCutList() {
  let cutList = document.getElementById('cut-list');
  cutList.innerHTML = '';

  cuts.forEach((cut, index) => {
    let listItem = document.createElement('li');
    listItem.textContent = `${cut.name} - ${cut.length}x${cut.width} - ${cut.color} - ${cut.borderTape ? 'Fita de Borda' : 'Sem Fita de Borda'} - Bordas: ${cut.borders.join(', ')}`;

    // Criar botões
    let upButton = document.createElement('button');
    upButton.textContent = '↑';
    upButton.addEventListener('click', () => moveCut(index, 'up'));

    let downButton = document.createElement('button');
    downButton.textContent = '↓';
    downButton.addEventListener('click', () => moveCut(index, 'down'));

    let rotateButton = document.createElement('button');
    rotateButton.textContent = '↻';
    rotateButton.addEventListener('click', () => rotateCut(index));

    let removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', () => removeCut(index));

    // Adicionar botões ao item da lista
    listItem.appendChild(upButton);
    listItem.appendChild(downButton);
    listItem.appendChild(rotateButton);
    listItem.appendChild(removeButton);

    cutList.appendChild(listItem);
  });
}

// Função para mover o recorte na lista
function moveCut(index, direction) {
  if (direction === 'up' && index > 0) {
    [cuts[index], cuts[index - 1]] = [cuts[index - 1], cuts[index]];
    updateCutList();
  } else if (direction === 'down' && index < cuts.length - 1) {
    [cuts[index], cuts[index + 1]] = [cuts[index + 1], cuts[index]];
    updateCutList();
  }
}

// Função para girar o recorte na lista
function rotateCut(index) {
  let cut = cuts[index];
  [cut.length, cut.width] = [cut.width, cut.length];
  updateCutList();
}

// Função para remover um recorte da lista
function removeCut(index) {
  if (confirm('Você tem certeza que deseja remover este recorte?')) {
    cuts.splice(index, 1); // Remove o recorte da lista
    updateCutList(); // Atualiza a lista de recortes na interface
    updateCanvas(); // Atualiza o canvas para refletir a mudança
  }
}


// Função para reorganizar a lista de recortes e gerar o novo plano
function reorganizeCuts() {
  // Cria uma cópia da lista de recortes e a embaralha
  let shuffledCuts = [...cuts];
  shuffledCuts.sort(() => Math.random() - 0.5);

  // Atualiza a lista de recortes com a nova ordem
  cuts = shuffledCuts;

  // Atualiza a lista de recortes na interface
  updateCutList();

  // Atualiza o plano automaticamente
  updateCanvas();
}

// Atualizar o canvas e incluir a régua
function updateCanvas() {
  sheetWidth = parseFloat(document.getElementById('sheet-width').value);
  sheetHeight = parseFloat(document.getElementById('sheet-height').value);
  document.getElementById('canvas').width = sheetWidth * CM_TO_PX;
  document.getElementById('canvas').height = sheetHeight * CM_TO_PX;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'gray';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenhar régua
  drawRuler();

  // Organiza e desenha os recortes na nova ordem
  organizeAndDrawCuts();
}
// Configura o evento do botão "Reorganizar"
document.getElementById('reorganize').addEventListener('click', reorganizeCuts);



// Função para organizar e desenhar os recortes na nova ordem
function organizeAndDrawCuts() {
  let occupiedSpaces = [];
  let totalCutArea = 0;
  let totalBorderLength = 0;
  let sawThickness = parseFloat(document.getElementById('saw-thickness').value) || 0;
  let useSawThickness = document.getElementById('use-saw-thickness').checked;

  // Inicializa a posição do recorte atual
  for (let cut of cuts) {
    let position = findPositionForCut(cut, occupiedSpaces);
    if (position) {
      drawCut(position.x, position.y, cut.length, cut.width, cut.name, cut.color, cut.borderTape, cut.borders, useSawThickness, sawThickness);
      totalCutArea += cut.length * cut.width;
      occupiedSpaces.push({ 
        x: position.x, 
        y: position.y, 
        width: cut.length + (useSawThickness ? sawThickness : 0), 
        height: cut.width + (useSawThickness ? sawThickness : 0) 
      });

      if (cut.borderTape) {
        for (let border of cut.borders) {
          switch (border) {
            case 'top':
            case 'bottom':
              totalBorderLength += cut.length;
              break;
            case 'left':
            case 'right':
              totalBorderLength += cut.width;
              break;
          }
        }
      }
    } else {
      alert(`Não há espaço na chapa para o recorte ${cut.name} considerando a espessura da borda!`);
    }
  }

  let totalRemainingArea = (sheetWidth * sheetHeight) - totalCutArea;
  // Opcional: Exibir ou usar o totalRemainingArea e totalBorderLength conforme necessário
}

// Função para desenhar a régua ao redor da chapa
function drawRuler() {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // Desenhar régua horizontal (superior e inferior)
  for (let i = 0; i <= sheetWidth; i += 10) {
      let posX = i * CM_TO_PX;
      ctx.beginPath();
      ctx.moveTo(posX, 0);
      ctx.lineTo(posX, 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(posX, sheetHeight * CM_TO_PX);
      ctx.lineTo(posX, sheetHeight * CM_TO_PX - 10);
      ctx.stroke();

      ctx.fillText(`${i} cm`, posX, 20);
      ctx.fillText(`${i} cm`, posX, sheetHeight * CM_TO_PX - 20);
  }

  // Desenhar régua vertical (esquerda e direita)
  for (let i = 0; i <= sheetHeight; i += 10) {
      let posY = i * CM_TO_PX;
      ctx.beginPath();
      ctx.moveTo(0, posY);
      ctx.lineTo(10, posY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sheetWidth * CM_TO_PX, posY);
      ctx.lineTo(sheetWidth * CM_TO_PX - 10, posY);
      ctx.stroke();

      ctx.fillText(`${i} cm`, 20, posY);
      ctx.fillText(`${i} cm`, sheetWidth * CM_TO_PX - 20, posY);
  }
}

// Função para empacotar o texto dentro do recorte
function wrapText(ctx, text, x, y, maxWidth) {
  const words = text.split('\n');
  let lineHeight = 14; // Altura de cada linha de texto

  words.forEach((word, index) => {
      ctx.fillText(word, x, y + index * lineHeight);
  });
}

// Função para gerar o conteúdo do CSV
function generateCSVContent() {
  let totalCuts = cuts.length;
  let csvContent = "Número de Recortes: " + totalCuts + "\n";
  csvContent += "Nome,Medidas,Cor,Fita de Borda\n";

  let totalBorderTapeLength = 0;

  cuts.forEach(cut => {
    let { name, length, width, color, borderTape, borders } = cut;

    // Calcular o comprimento da fita de borda para o recorte atual
    let borderLength = 0;
    if (borderTape) {
      borders.forEach(border => {
        if (border === 'top' || border === 'bottom') {
          borderLength += length;
        } else if (border === 'left' || border === 'right') {
          borderLength += width;
        }
      });
      totalBorderTapeLength += borderLength;
    }

    // Usar o código da cor em vez do quadrado colorido
    csvContent += `${name},${length}x${width},${color},${borderTape ? 'Sim' : 'Não'}\n`;
  });

  // Adicionar o total de fita de borda gasta ao final do CSV
  csvContent += "\nTotal de Fita de Borda Gasta (cm): " + totalBorderTapeLength;

  return csvContent;
}

// Função para baixar o CSV
function downloadCsv(csvContent) {
  let csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  let csvUrl = URL.createObjectURL(csvBlob);
  let csvLink = document.createElement('a');
  csvLink.href = csvUrl;
  csvLink.download = 'relatorio_de_corte.csv';
  csvLink.click();
}

// Função para gerar e baixar o desenho do plano de corte e o relatório em CSV
function generateReportAndDownload() {
  // Baixar a imagem do plano de corte
  let canvas = document.getElementById('canvas');
  let imageUrl = canvas.toDataURL('image/png');
  let imageLink = document.createElement('a');
  imageLink.href = imageUrl;
  imageLink.download = 'plano_de_corte_com_medidas.png';
  imageLink.click();

  // Gerar e baixar o CSV
  let csvContent = generateCSVContent();  // Chame a função correta aqui
  downloadCsv(csvContent);
}

// Configura o evento de clique no botão
document.getElementById('download').addEventListener('click', generateReportAndDownload);
