import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outPath = path.resolve(process.cwd(), 'report.pdf');
const eslintPath = path.resolve(process.cwd(), 'eslint_output.txt');
const originalPath = path.resolve(process.cwd(), 'src', 'ReportGenerator.js');
const refactoredPath = path.resolve(process.cwd(), 'src', 'ReportGenerator.refactored.js');

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return '[Arquivo não encontrado: ' + p + ']';
  }
}

const eslintOutput = readSafe(eslintPath);
const originalSrc = readSafe(originalPath);
const refactoredSrc = readSafe(refactoredPath);

const doc = new PDFDocument({ autoFirstPage: false });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

// Page 1: Cover
doc.addPage();
const pageWidth = doc.page.width;

doc.fontSize(18).text('Matéria: Teste de Software', { align: 'center' });
doc.moveDown(1);

doc.fontSize(16).text('Trabalho: Detecção de Bad Smells e Refatoração', { align: 'center' });

doc.moveDown(2);
// Student info (customized per request)
const userName = 'Arthur Ferreira Costa';
const matricula = 'Matrícula: 812057';

doc.fontSize(14).text(`Aluno: ${userName}`, { align: 'center' });
doc.moveDown(0.5);
doc.text(matricula, { align: 'center' });

// Page 2: Análise de Smells
doc.addPage();
doc.fontSize(16).text('Análise de Smells', { underline: true });
doc.moveDown(0.5);

doc.fontSize(12).list([
  'Long Method / Alta complexidade cognitiva: o método `generateReport` concentra muitas responsabilidades (montagem de cabeçalho, corpo, lógica de autorização por papel do usuário, formatação CSV/HTML e rodapé). Métodos longos são difíceis de entender, testar em pedaços e manter.',
  'Condicionais aninhadas / Complexidade de decisão: várias ramificações if/else (por tipo de relatório e papel de usuário) levam a muitos caminhos diferentes. Isso aumenta a probabilidade de bugs e torna difícil adicionar novos formatos de relatório.',
  'Mutação de entrada (side-effect): o código original marcava `item.priority = true` durante a geração do relatório. Mutar objetos de entrada pode causar efeitos colaterais inesperados em outras partes do sistema e atrapalhar testes que assumem imutabilidade.',
]);

doc.moveDown(0.7);

doc.fontSize(12).text('Por que são problemáticos para manutenção e testes:', { underline: true });
doc.moveDown(0.3);

doc.fontSize(11).text(' - Long methods e alta complexidade tornam regressões mais prováveis; cobrir todos os caminhos em testes é mais difícil.\n - Condicionais aninhadas escondem responsabilidades; a lógica deveria ser separada por responsabilidade (formato, autorização, apresentação).\n - Mutação de entradas cria acoplamento e torna os testes menos previsíveis (ordem dos testes pode influenciar resultados).', { lineGap: 4 });

// Page 3: Relatório da Ferramenta
doc.addPage();
doc.fontSize(16).text('Relatório da Ferramenta (ESLint + sonarjs)', { underline: true });
doc.moveDown(0.5);

doc.fontSize(12).text('Comando executado: `npx eslint src/`', { italics: true });
doc.moveDown(0.5);

doc.fontSize(10).text('Saída do ESLint (antes/na iteração inicial da refatoração):', { underline: false });

// Print eslint output as preformatted
const eslintLines = eslintOutput.split('\n');
let y = doc.y;
doc.moveDown(0.3);

doc.font('Courier').fontSize(9);
for (const line of eslintLines) {
  // Add lines, add new page if near bottom
  if (doc.y > doc.page.height - 72) {
    doc.addPage();
    doc.font('Courier').fontSize(9);
  }
  doc.text(line);
}

// Next page: Processo de Refatoração (Antes / Depois)
doc.addPage();
doc.font('Helvetica').fontSize(16).text('Processo de Refatoração', { underline: true });

doc.moveDown(0.5);

doc.fontSize(12).text('Escolhi corrigir principalmente o smell de "Long Method / Alta complexidade cognitiva" no método `generateReport`. A técnica principal aplicada foi Extract Method e separação de responsabilidades (Header / Body / Footer builders).', { lineGap: 4 });

doc.moveDown(0.5);

doc.fontSize(12).text('Trecho "Antes" (excerto do `src/ReportGenerator.js`):', { underline: true });

const beforeSnippet = (function () {
  const lines = originalSrc.split('\n');
  // find the loop region to show
  const start = Math.max(0, 20);
  return lines.slice(start, start + 28).join('\n');
})();

doc.moveDown(0.3);
doc.font('Courier').fontSize(9);
for (const line of beforeSnippet.split('\n')) {
  if (doc.y > doc.page.height - 72) {
    doc.addPage();
    doc.font('Courier').fontSize(9);
  }
  doc.text(line);
}

// After snippet
if (doc.y > doc.page.height - 120) doc.addPage();

doc.addPage();
doc.font('Helvetica').fontSize(12).text('Trecho "Depois" (excerto do `src/ReportGenerator.refactored.js`):', { underline: true });

const afterSnippet = (function () {
  const lines = refactoredSrc.split('\n');
  const start = Math.max(0, 0);
  return lines.slice(start, 200).join('\n');
})();

doc.moveDown(0.3);
doc.font('Courier').fontSize(9);
for (const line of afterSnippet.split('\n')) {
  if (doc.y > doc.page.height - 72) {
    doc.addPage();
    doc.font('Courier').fontSize(9);
  }
  doc.text(line);
}

// Conclusion
if (doc.y > doc.page.height - 120) doc.addPage();

doc.addPage();
doc.font('Helvetica').fontSize(16).text('Conclusão', { underline: true });

doc.moveDown(0.5);
doc.fontSize(12).text('Testes como rede de segurança: Os testes existentes permitiram refatorar com confiança — eu pude reorganizar e extrair métodos sem mudar comportamento observável. A redução de bad smells (menos complexidade, responsabilidade única, evitar mutações) facilita manutenção, revisões e extensão futura do código.', { lineGap: 4 });

// Footer small note
if (doc.y > doc.page.height - 72) doc.addPage();
doc.moveDown(1);
doc.fontSize(9).text('Observação: Capa contém placeholders (nome e matrícula). Atualize o arquivo `scripts/generateReportPdf.js` ou a capa no PDF se quiser seus dados reais.', { align: 'left' });

// Finalize
doc.end();

stream.on('finish', () => {
  console.log('PDF gerado em:', outPath);
});
