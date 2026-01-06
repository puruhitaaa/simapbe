import { Workbook } from "exceljs";
import type { z } from "zod";

export type ColumnDefinition = {
  key: string;
  header: string;
  width?: number;
  validation?: {
    type: "list";
    formulae: string[] | readonly string[];
  };
  note?: string;
};

export class ExcelService {
  /**
   * Generates an Excel template with specified columns.
   * If validation rules are provided, it adds data validation (dropdowns).
   */
  static async generateTemplate(
    columns: ColumnDefinition[],
    sheetName = "Template"
  ): Promise<Buffer> {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    // Set headers
    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };

    // Add validation and notes
    columns.forEach((col, index) => {
      // 1-based index
      const colLetter = String.fromCharCode(65 + index); // Simplified for A-Z

      if (col.validation) {
        for (let i = 2; i <= 1000; i++) {
          sheet.getCell(`${colLetter}${i}`).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: col.validation.formulae as any,
          };
        }
      }

      if (col.note) {
        sheet.getCell(`${colLetter}1`).note = col.note;
      }
    });

    // Write to buffer
    const buffer = (await workbook.xlsx.writeBuffer()) as any;
    return Buffer.from(buffer);
  }

  /**
   * Exports data to Excel.
   */
  static async exportData(
    data: any[],
    columns: ColumnDefinition[],
    sheetName = "Export"
  ): Promise<Buffer> {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    // Set headers
    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));

    // Add data
    sheet.addRows(data);

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    const buffer = (await workbook.xlsx.writeBuffer()) as any;
    return Buffer.from(buffer);
  }

  /**
   * Parses an Excel file buffer into an array of objects.
   */
  static async parseExcel<T>(
    buffer: Buffer,
    schema: z.ZodSchema<T>,
    columnMapping: Record<string, string> // Header Name -> Object Key
  ): Promise<{ success: T[]; errors: any[] }> {
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      throw new Error("No worksheet found in the Excel file");
    }

    const rows: any[] = [];
    const errors: any[] = [];

    // Map headers to keys
    const headerRow = sheet.getRow(1);
    const keyMap: Record<number, string> = {};

    headerRow.eachCell((cell, colNumber) => {
      const headerText = cell.value?.toString().trim();
      if (headerText && columnMapping[headerText]) {
        keyMap[colNumber] = columnMapping[headerText];
      }
    });

    // Iterate rows
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData: any = {};
      let isEmpty = true;

      row.eachCell((cell, colNumber) => {
        const key = keyMap[colNumber];
        if (key) {
          // Handle specific cell types if needed
          let value = cell.value;
          if (typeof value === "object" && value !== null && "text" in value) {
            value = (value as any).text; // Handle hyperlinks
          }
          rowData[key] = value;
          isEmpty = false;
        }
      });

      if (isEmpty) return;

      // Validate
      const result = schema.safeParse(rowData);
      if (result.success) {
        rows.push(result.data);
      } else {
        errors.push({ row: rowNumber, error: result.error.flatten() });
      }
    });

    return { success: rows, errors };
  }
}
