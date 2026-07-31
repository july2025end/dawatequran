const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function generateExcel() {
  console.log(' Connecting to Database...');
  const client = new Client({ connectionString });
  await client.connect();

  // 1. Fetch DB data
  const dbCirclesRes = await client.query(`
    SELECT 
      qc.id as circle_id,
      qc.name as circle_name,
      uc.id as uc_id,
      uc.name as uc_name,
      sec.name as sector_name,
      z.name as zone_name,
      prof.full_name as profile_head_name,
      prof.phone as profile_head_phone
    FROM quran_circles qc
    JOIN union_councils uc ON qc.uc_id = uc.id
    JOIN sectors sec ON uc.sector_id = sec.id
    JOIN zones z ON sec.zone_id = z.id
    LEFT JOIN public.profiles prof ON prof.assigned_circle_id = qc.id
    ORDER BY z.name, sec.name, uc.name, qc.name;
  `);

  const dbParticipantsRes = await client.query(`
    SELECT 
      p.id,
      p.full_name,
      p.phone,
      p.type,
      p.remarks,
      p.circle_id
    FROM participants p
    ORDER BY p.full_name;
  `);

  // Map participants by circle_id
  const participantsByCircle = {};
  for (const p of dbParticipantsRes.rows) {
    if (!participantsByCircle[p.circle_id]) {
      participantsByCircle[p.circle_id] = [];
    }
    participantsByCircle[p.circle_id].push(p);
  }

  // Load roster.json for Murabbi fallback
  const rosterPath = path.join(__dirname, 'seed_data/roster.json');
  const rosterMurabbiMap = {}; // key: "uc_name|circle_name" -> murabbi name
  const rosterParticipantsMap = {}; // key: "uc_name|circle_name" -> array of names

  if (fs.existsSync(rosterPath)) {
    const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
    for (const z of roster.zones) {
      for (const s of z.sectors) {
        for (const uc of s.union_councils) {
          for (const c of uc.quran_circles) {
            const key = `${uc.name.trim().toLowerCase()}|${c.name.trim().toLowerCase()}`;
            rosterMurabbiMap[key] = c.murabbi;
            rosterParticipantsMap[key] = c.participants || [];
          }
        }
      }
    }
  }

  // Build merged data structure
  const masterData = [];
  let totalCirclesCount = 0;
  let totalMembersCount = 0;

  for (const cRow of dbCirclesRes.rows) {
    totalCirclesCount++;
    const key = `${cRow.uc_name.trim().toLowerCase()}|${cRow.circle_name.trim().toLowerCase()}`;
    
    // Circle Head priority: DB Profile -> roster.json Murabbi -> "Unassigned / Pending"
    let headName = cRow.profile_head_name;
    if (!headName || headName.trim() === '') {
      headName = rosterMurabbiMap[key] || 'Pending';
    }
    const headPhone = cRow.profile_head_phone || '';

    // Members from DB
    let dbMembers = participantsByCircle[cRow.circle_id] || [];
    
    // If DB members empty for this circle, check roster.json participants
    let membersList = [];
    if (dbMembers.length > 0) {
      membersList = dbMembers.map(m => ({
        name: m.full_name,
        phone: m.phone || '-',
        type: m.type === 'haazir_arkan' ? 'Haazir Arkan' : (m.type === 'aam_afraad' ? 'Aam Afraad' : 'Rukn / Member'),
        remarks: m.remarks || '-'
      }));
    } else {
      const rosterNames = rosterParticipantsMap[key] || [];
      membersList = rosterNames.map(n => ({
        name: n,
        phone: '-',
        type: 'Rukn / Member',
        remarks: '-'
      }));
    }

    totalMembersCount += membersList.length;

    masterData.push({
      circleId: cRow.circle_id,
      circleName: cRow.circle_name,
      ucName: cRow.uc_name,
      sectorName: cRow.sector_name,
      zoneName: cRow.zone_name,
      headName: headName,
      headPhone: headPhone,
      members: membersList
    });
  }

  console.log(` Data summary: ${masterData.length} circles, ${totalMembersCount} total members loaded.`);

  // Create Excel Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dawat-e-Quran Management System';
  workbook.lastModifiedBy = 'Dawat-e-Quran System';
  workbook.created = new Date();

  // Color Palette Definitions (Hex without # for ExcelJS)
  const COLOR_HEADER_BG = '1F4E78';       // Dark Navy Blue
  const COLOR_HEADER_TEXT = 'FFFFFF';     // White
  const COLOR_ACCENT_BG = '2F5597';       // Medium Soft Blue
  const COLOR_SUBHEADER_BG = 'D9E1F2';    // Light Slate Blue
  const COLOR_ZEBRA_BG = 'F2F5F9';        // Very Light Blue-Gray
  const COLOR_BORDER = 'D9D9D9';          // Soft Gray Border
  const COLOR_TEXT_MAIN = '262626';       // Dark Gray Text
  const COLOR_HIGHLIGHT = 'E2EFDA';      // Soft Green Badge
  const COLOR_HEAD_BG = 'FFF2CC';         // Soft Yellow for Head Row

  // -------------------------------------------------------------
  // WORKSHEET 1: UC & Circles Summary
  // -------------------------------------------------------------
  const wsSummary = workbook.addWorksheet('UC & Circles Summary', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  wsSummary.mergeCells('A1:G2');
  const titleCell = wsSummary.getCell('A1');
  titleCell.value = 'DAWAT-E-QURAN - UNION COUNCILS & CIRCLES OVERVIEW';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLOR_HEADER_TEXT } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Stat summary row
  wsSummary.mergeCells('A3:C3');
  wsSummary.getCell('A3').value = `Total Circles: ${totalCirclesCount} | Total Members: ${totalMembersCount}`;
  wsSummary.getCell('A3').font = { name: 'Calibri', size: 11, italic: true, bold: true, color: { argb: '595959' } };
  wsSummary.getCell('A3').alignment = { vertical: 'middle' };

  // Headers for Summary
  const summaryHeaders = ['S.No', 'Zone', 'Sector', 'Union Council (UC)', 'Circle Name', 'Circle Head (Murabbi)', 'Total Members'];
  const summaryHeaderRow = wsSummary.addRow(summaryHeaders);
  summaryHeaderRow.height = 26;

  summaryHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLOR_HEADER_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } }
    };
  });

  // Populate Summary Rows
  masterData.forEach((item, index) => {
    const row = wsSummary.addRow([
      index + 1,
      item.zoneName,
      item.sectorName,
      item.ucName,
      item.circleName,
      item.headName,
      item.members.length
    ]);

    row.height = 20;

    const isZebra = index % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: COLOR_TEXT_MAIN } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 7 ? 'center' : 'left'
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
        left: { style: 'thin', color: { argb: COLOR_BORDER } },
        right: { style: 'thin', color: { argb: COLOR_BORDER } }
      };

      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA_BG } };
      }

      if (colNumber === 6 && item.headName !== 'Pending') {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '1F497D' } };
      }
    });
  });

  // -------------------------------------------------------------
  // WORKSHEET 2: Master Roster (Flat Table with Filters)
  // -------------------------------------------------------------
  const wsMaster = workbook.addWorksheet('Master Members Directory', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  wsMaster.mergeCells('A1:J2');
  const mTitleCell = wsMaster.getCell('A1');
  mTitleCell.value = 'DAWAT-E-QURAN - MASTER CIRCLE HEADS & MEMBERS DIRECTORY';
  mTitleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLOR_HEADER_TEXT } };
  mTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
  mTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const masterHeaders = [
    'S.No',
    'Zone',
    'Sector',
    'Union Council (UC)',
    'Circle Name',
    'Circle Head (Murabbi)',
    'Member Name',
    'Phone Number',
    'Member Type',
    'Remarks / Status'
  ];

  const mHeaderRow = wsMaster.addRow(masterHeaders);
  mHeaderRow.height = 26;

  mHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLOR_HEADER_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } }
    };
  });

  let sNo = 1;
  masterData.forEach((circleItem) => {
    if (circleItem.members.length === 0) {
      // Circle with no members yet
      const row = wsMaster.addRow([
        sNo++,
        circleItem.zoneName,
        circleItem.sectorName,
        circleItem.ucName,
        circleItem.circleName,
        circleItem.headName,
        'No members recorded',
        '-',
        '-',
        'Pending members'
      ]);
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '7F7F7F' } };
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
        cell.border = { bottom: { style: 'thin', color: { argb: COLOR_BORDER } } };
      });
    } else {
      circleItem.members.forEach((m, mIdx) => {
        const row = wsMaster.addRow([
          sNo++,
          circleItem.zoneName,
          circleItem.sectorName,
          circleItem.ucName,
          circleItem.circleName,
          circleItem.headName,
          m.name,
          m.phone,
          m.type,
          m.remarks
        ]);

        row.height = 20;
        const isAlternate = sNo % 2 === 0;

        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10, color: { argb: COLOR_TEXT_MAIN } };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 1 || colNumber === 8 || colNumber === 9 ? 'center' : 'left'
          };
          cell.border = {
            bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
            left: { style: 'thin', color: { argb: COLOR_BORDER } },
            right: { style: 'thin', color: { argb: COLOR_BORDER } }
          };

          if (isAlternate) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA_BG } };
          }

          // Highlight Member Type
          if (colNumber === 9 && m.type === 'Haazir Arkan') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '276A3C' } };
          }
        });
      });
    }
  });

  // Enable AutoFilter for Master Sheet
  wsMaster.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: sNo + 2, column: 10 }
  };

  // -------------------------------------------------------------
  // WORKSHEET 3: Grouped by UC & Circle (Formatted Cards View)
  // -------------------------------------------------------------
  const wsGrouped = workbook.addWorksheet('UC & Circle Structured View', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  wsGrouped.mergeCells('A1:E2');
  const gTitleCell = wsGrouped.getCell('A1');
  gTitleCell.value = 'DAWAT-E-QURAN - UC & CIRCLE STRUCTURED CARDS';
  gTitleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLOR_HEADER_TEXT } };
  gTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
  gTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  let currentUC = '';
  let rowCursor = 4;

  masterData.forEach((circleItem) => {
    // If new UC block, print UC Section Banner
    if (circleItem.ucName !== currentUC) {
      currentUC = circleItem.ucName;

      wsGrouped.mergeCells(`A${rowCursor}:E${rowCursor}`);
      const ucBanner = wsGrouped.getCell(`A${rowCursor}`);
      ucBanner.value = `📍 UNION COUNCIL: ${currentUC} (${circleItem.sectorName})`;
      ucBanner.font = { name: 'Calibri', size: 13, bold: true, color: { argb: COLOR_HEADER_TEXT } };
      ucBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
      ucBanner.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      wsGrouped.getRow(rowCursor).height = 28;
      rowCursor++;
    }

    // Circle Header Row
    wsGrouped.mergeCells(`A${rowCursor}:E${rowCursor}`);
    const circleHeaderCell = wsGrouped.getCell(`A${rowCursor}`);
    circleHeaderCell.value = `📖 ${circleItem.circleName} | Circle Head (Murabbi): ${circleItem.headName} ${circleItem.headPhone ? ' (' + circleItem.headPhone + ')' : ''}`;
    circleHeaderCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '1F497D' } };
    circleHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBHEADER_BG } };
    circleHeaderCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    wsGrouped.getRow(rowCursor).height = 24;
    rowCursor++;

    // Table Column Headers for Members in this Circle
    const circleTableHeaders = ['S.No', 'Member Name', 'Phone Number', 'Member Category', 'Status / Remarks'];
    const cHeadRow = wsGrouped.addRow(circleTableHeaders);
    cHeadRow.height = 22;
    cHeadRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR_HEADER_TEXT } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT_BG } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: COLOR_BORDER } },
        bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
        left: { style: 'thin', color: { argb: COLOR_BORDER } },
        right: { style: 'thin', color: { argb: COLOR_BORDER } }
      };
    });
    rowCursor++;

    if (circleItem.members.length === 0) {
      const emptyRow = wsGrouped.addRow([1, 'No members recorded for this circle', '-', '-', 'Pending']);
      emptyRow.height = 20;
      emptyRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '7F7F7F' } };
        cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'center' : 'left' };
        cell.border = { bottom: { style: 'thin', color: { argb: COLOR_BORDER } } };
      });
      rowCursor++;
    } else {
      circleItem.members.forEach((m, mIdx) => {
        const mRow = wsGrouped.addRow([mIdx + 1, m.name, m.phone, m.type, m.remarks]);
        mRow.height = 20;

        mRow.eachCell((cell, colNum) => {
          cell.font = { name: 'Calibri', size: 10, color: { argb: COLOR_TEXT_MAIN } };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNum === 1 || colNum === 3 || colNum === 4 ? 'center' : 'left'
          };
          cell.border = {
            bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
            left: { style: 'thin', color: { argb: COLOR_BORDER } },
            right: { style: 'thin', color: { argb: COLOR_BORDER } }
          };
          if (mIdx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA_BG } };
          }
        });
        rowCursor++;
      });
    }

    // Blank row separation between circles
    wsGrouped.addRow([]);
    rowCursor++;
  });

  // Adjust Column Widths across all worksheets
  [wsSummary, wsMaster, wsGrouped].forEach((sheet) => {
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const strVal = cell.value ? cell.value.toString() : '';
        // Skip title row lengths for width calculation
        if (strVal.length < 60 && strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      });
      column.width = Math.max(maxLen + 4, 14);
    });
  });

  // Specific overrides for optimal reading
  wsMaster.getColumn(1).width = 8;   // S.No
  wsMaster.getColumn(2).width = 18;  // Zone
  wsMaster.getColumn(3).width = 22;  // Sector
  wsMaster.getColumn(4).width = 22;  // UC
  wsMaster.getColumn(5).width = 16;  // Circle Name
  wsMaster.getColumn(6).width = 28;  // Circle Head
  wsMaster.getColumn(7).width = 28;  // Member Name
  wsMaster.getColumn(8).width = 18;  // Phone
  wsMaster.getColumn(9).width = 18;  // Type
  wsMaster.getColumn(10).width = 45; // Remarks

  wsGrouped.getColumn(1).width = 8;   // S.No
  wsGrouped.getColumn(2).width = 30;  // Member Name
  wsGrouped.getColumn(3).width = 20;  // Phone
  wsGrouped.getColumn(4).width = 20;  // Category
  wsGrouped.getColumn(5).width = 45;  // Remarks

  // Save Excel file to workspace root & artifacts
  const outputFileName = 'UC_Circles_and_Members_Roster.xlsx';
  const outputPath = path.join(__dirname, '..', outputFileName);

  await workbook.xlsx.writeFile(outputPath);
  console.log(`\n Excel sheet created successfully at: ${outputPath}`);

  await client.end();
}

generateExcel().catch(console.error);
