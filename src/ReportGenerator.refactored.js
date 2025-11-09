export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  // Public API: preserve the original signature/behavior
  generateReport(reportType, user, items) {
    const header = this._buildHeader(reportType, user);
    const { body, total } = this._buildBody(reportType, user, items);
    const footer = this._buildFooter(reportType, total);

    // Keep the same return shape as the original implementation (trimmed)
    return (header + body + footer).trim();
  }

  // --- Header builders ---
  _buildHeader(reportType, user) {
    if (reportType === 'CSV') {
      return 'ID,NOME,VALOR,USUARIO\n';
    }

    if (reportType === 'HTML') {
      return (
        '<html><body>\n' +
        '<h1>Relatório</h1>\n' +
        `<h2>Usuário: ${user.name}</h2>\n` +
        '<table>\n' +
        '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
      );
    }

    return '';
  }

  // --- Body builder ---
  _buildBody(reportType, user, items) {
    let report = '';
    let total = 0;

    for (const item of items) {
      if (!this._shouldIncludeItemForUser(item, user)) continue;

      const isPriority = user.role === 'ADMIN' && item.value > 1000;

      if (reportType === 'CSV') {
        report += this._csvRow(item, user);
        total += item.value;
      } else if (reportType === 'HTML') {
        report += this._htmlRow(item, isPriority);
        total += item.value;
      }
    }

    return { body: report, total };
  }

  _shouldIncludeItemForUser(item, user) {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'USER') return item.value <= 500;
    // Default conservative: hide item
    return false;
  }

  _csvRow(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  _htmlRow(item, isPriority) {
    if (isPriority) {
      return `<tr style="font-weight:bold;"><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
    }

    return `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  // --- Footer builder ---
  _buildFooter(reportType, total) {
    if (reportType === 'CSV') {
      // keep same formatting as original
      return `\nTotal,,\n${total},,\n`;
    }

    if (reportType === 'HTML') {
      return `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`;
    }

    return '';
  }
}
