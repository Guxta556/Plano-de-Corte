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

// Função para organizar os recortes na chapa
function organizeCuts() {
  // Ordenar os recortes por área decrescente
  cuts.sort((a, b) => b.length * b.width - a.length * a.width);

  let occupiedSpaces = [];
  let totalCutArea = 0;
  let totalBorderLength = 0;

  // Inicializar a posição do recorte atual
  for (let cut of cuts) {
    let position = findPositionForCut(cut, occupiedSpaces);
    if (position) {
      drawCut(position.x, position.y, cut.length, cut.width, cut.name, cut.color, cut.borderTape, cut.borders);
      totalCutArea += cut.length * cut.width;
      occupiedSpaces.push({ x: position.x, y: position.y, width: cut.length, height: cut.width });

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
      alert(`Não há espaço na chapa para o recorte ${cut.name}!`);
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


// Função para desenhar um recorte na chapa
function drawCut(x, y, length, width, name, color, borderTape, borders) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CM_TO_PX, y * CM_TO_PX, length * CM_TO_PX, width * CM_TO_PX);

  if (borderTape) {
    ctx.lineWidth = 1; // Largura da linha da fita de borda
    ctx.strokeStyle = 'blue'; // Cor da fita de borda
    borders.forEach(border => {
      switch (border) {
        case 'top':
          ctx.beginPath();
          ctx.moveTo(x * CM_TO_PX, y * CM_TO_PX);
          ctx.lineTo((x + length) * CM_TO_PX, y * CM_TO_PX);
          ctx.stroke();
          break;
        case 'right':
          ctx.beginPath();
          ctx.moveTo((x + length) * CM_TO_PX, y * CM_TO_PX);
          ctx.lineTo((x + length) * CM_TO_PX, (y + width) * CM_TO_PX);
          ctx.stroke();
          break;
        case 'bottom':
          ctx.beginPath();
          ctx.moveTo((x + length) * CM_TO_PX, (y + width) * CM_TO_PX);
          ctx.lineTo(x * CM_TO_PX, (y + width) * CM_TO_PX);
          ctx.stroke();
          break;
        case 'left':
          ctx.beginPath();
          ctx.moveTo(x * CM_TO_PX, (y + width) * CM_TO_PX);
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

// Função para gerar o relatório e baixar a imagem
function generateReportAndDownload() {
  let { totalCutArea, totalRemainingArea, totalBorderTapeLength } = organizeCuts();

  // Baixar imagem
  let canvas = document.getElementById('canvas');
  let imageUrl = canvas.toDataURL('image/png');
  let link = document.createElement('a');
  link.href = imageUrl;
  link.download = 'plano_de_corte.png';
  link.click();

  // Gerar relatório
  let report = `Área Total dos Recortes: ${totalCutArea.toFixed(2)} cm²\n`;
  report += `Área Restante da Chapa: ${totalRemainingArea.toFixed(2)} cm²\n`;
  report += `Comprimento Total da Fita de Borda: ${totalBorderTapeLength.toFixed(2)} cm\n`;

  let reportBlob = new Blob([report], { type: 'text/plain' });
  let reportLink = document.createElement('a');
  reportLink.href = URL.createObjectURL(reportBlob);
  reportLink.download = 'relatorio_de_corte.txt';
  reportLink.click();
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

// Função para atualizar o canvas com base na ordem atual dos recortes
function updateCanvas() {
  // Atualiza as dimensões do canvas
  sheetWidth = parseFloat(document.getElementById('sheet-width').value);
  sheetHeight = parseFloat(document.getElementById('sheet-height').value);
  document.getElementById('canvas').width = sheetWidth * CM_TO_PX;
  document.getElementById('canvas').height = sheetHeight * CM_TO_PX;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'gray';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
