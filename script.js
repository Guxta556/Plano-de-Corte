const canvas = document.getElementById('cutting-canvas');
const ctx = canvas.getContext('2d');

// Função para desenhar o plano de corte
function drawCuttingPlan() {
    // Obter os valores inseridos pelo usuário
    const sheetWidth = document.getElementById('sheet-width').value;
    const sheetHeight = document.getElementById('sheet-height').value;
    const items = document.querySelectorAll('.item');

    // Desenhar a chapa
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, sheetWidth, sheetHeight);

    // Desenhar os itens
    items.forEach((item) => {
        const itemName = item.querySelector('.item-name').value;
        const itemLength = item.querySelector('.item-length').value;
        const itemWidth = item.querySelector('.item-width').value;
        const itemQuantity = item.querySelector('.item-quantity').value;

        // Desenhar o item
        ctx.fillStyle = 'blue';
        ctx.fillRect(10, 10, itemLength, itemWidth);

        // Adicionar texto ao item
        ctx.font = '24px serif';
        ctx.fillStyle = 'black';
        ctx.fillText(itemName, 10, 30);
    });
}

// Adicionar evento de submit ao formulário
document.getElementById('cutting-form').addEventListener('submit', (e) => {
    e.preventDefault();
    drawCuttingPlan();
});