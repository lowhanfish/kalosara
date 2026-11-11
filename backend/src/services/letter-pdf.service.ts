import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LetterRequest } from '@prisma/client';

let currentDir = '';
try {
  currentDir = path.dirname(fileURLToPath(import.meta.url));
} catch {
  currentDir = process.cwd();
}

export class LetterPdfService {
  getUploadDir(): string {
    if (process.env.UPLOAD_ROOT) {
      return process.env.UPLOAD_ROOT;
    }
    const vpsShared = '/srv/kalosara/shared/uploads';
    if (fsSync.existsSync(vpsShared)) {
      return vpsShared;
    }
    return path.resolve(process.cwd(), '../shared/uploads');
  }

  private getLogoBuffer(): Buffer | null {
    const candidatePaths = [
      path.resolve(currentDir, '../../assets/konawe.png'),
      path.resolve(currentDir, '../assets/konawe.png'),
      path.resolve(process.cwd(), 'assets/konawe.png'),
      path.resolve(process.cwd(), 'backend/assets/konawe.png'),
      path.resolve(process.cwd(), 'public/images/watundehoa/konawe.png'),
      path.resolve(
        process.cwd(),
        'backend/public/images/watundehoa/konawe.png',
      ),
      path.resolve(
        process.cwd(),
        '../frontend/public/images/watundehoa/konawe.png',
      ),
      path.resolve(
        currentDir,
        '../../../frontend/public/images/watundehoa/konawe.png',
      ),
      '/srv/kalosara/current/frontend/public/images/watundehoa/konawe.png',
      '/srv/kalosara/current/backend/assets/konawe.png',
      '/srv/kalosara/current/backend/public/images/watundehoa/konawe.png',
    ];

    for (const p of candidatePaths) {
      if (fsSync.existsSync(p)) {
        try {
          return fsSync.readFileSync(p);
        } catch {
          // continue
        }
      }
    }
    return null;
  }

  async generatePdf(letter: LetterRequest): Promise<{
    storagePath: string;
    pdfBuffer: Buffer;
  }> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const marginX = 54;
    let cursorY = height - 36; // Margin atas proporsional dan rapi

    // 1. KOP SURAT
    // Embed Lambang Daerah (Konawe / Pemda) jika tersedia
    const logoBuffer = this.getLogoBuffer();
    let logoImage = null;
    if (logoBuffer) {
      try {
        logoImage = await pdfDoc.embedPng(logoBuffer);
      } catch {
        logoImage = null;
      }
    }

    const drawCenteredText = (
      text: string,
      font: PDFFont,
      size: number,
      gap: number = 3,
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: cursorY,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      cursorY -= size + gap;
    };

    drawCenteredText('PEMERINTAH KABUPATEN KOLAKA UTARA', fontBold, 11, 2);
    drawCenteredText('KECAMATAN WATUNOHU', fontBold, 11, 2);
    drawCenteredText('KELURAHAN WATUNDEHOA', fontBold, 13, 3);
    drawCenteredText(
      'Alamat: Jl. Poros Watunohu - Kolaka Utara, Kode Pos 93554',
      fontRegular,
      8.5,
      5,
    );

    if (logoImage) {
      const logoSize = 56;
      page.drawImage(logoImage, {
        x: marginX + 4,
        y: cursorY + 4,
        width: logoSize,
        height: logoSize,
      });
    }

    // Garis Kop Surat Ganda
    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: width - marginX, y: cursorY },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    cursorY -= 2.5;
    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: width - marginX, y: cursorY },
      thickness: 0.75,
      color: rgb(0, 0, 0),
    });

    cursorY -= 14;

    // 2. JUDUL SURAT & NOMOR
    const titleMap: Record<string, string> = {
      SKU: 'SURAT KETERANGAN USAHA',
      SKTM: 'SURAT KETERANGAN TIDAK MAMPU',
      DOMISILI: 'SURAT KETERANGAN DOMISILI',
      PENGANTAR_SKCK: 'SURAT PENGANTAR SKCK',
      BELUM_MENIKAH: 'SURAT KETERANGAN BELUM MENIKAH',
      BELUM_BEKERJA: 'SURAT KETERANGAN BELUM / TIDAK BEKERJA',
      BELUM_MEMILIKI_RUMAH: 'SURAT KETERANGAN BELUM MEMILIKI RUMAH',
      PENGHASILAN: 'SURAT KETERANGAN PENGHASILAN',
      PENGANTAR_NIKAH: 'SURAT PENGANTAR NIKAH',
      AHLI_WARIS: 'SURAT KETERANGAN AHLI WARIS / PENGUASAAN TANAH',
      LAINNYA: 'SURAT KETERANGAN',
    };

    const docTitle = titleMap[letter.type] || 'SURAT KETERANGAN';
    const titleSize = 12;
    const titleWidth = fontBold.widthOfTextAtSize(docTitle, titleSize);

    // Judul Surat
    page.drawText(docTitle, {
      x: (width - titleWidth) / 2,
      y: cursorY,
      size: titleSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Garis Bawah Judul Surat (Underline tepat di bawah judul)
    page.drawLine({
      start: { x: (width - titleWidth) / 2, y: cursorY - 2.5 },
      end: { x: (width + titleWidth) / 2, y: cursorY - 2.5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Jarak ke Nomor Surat
    cursorY -= 15;

    // Nomor Surat
    const nomorText = `Nomor: ${letter.letterNumber || '470 / ... / WTDH / ... / 2026'}`;
    const nomorSize = 9.5;
    const nomorWidth = fontRegular.widthOfTextAtSize(nomorText, nomorSize);
    page.drawText(nomorText, {
      x: (width - nomorWidth) / 2,
      y: cursorY,
      size: nomorSize,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });

    // Jarak ke Paragraf Pembuka
    cursorY -= 20;

    // 3. PARAGRAF PEMBUKA
    const introText =
      'Yang bertanda tangan di bawah ini, Lurah Watundehoa, Kecamatan Watunohu, Kabupaten Kolaka Utara, dengan ini menerangkan dengan sebenarnya bahwa:';
    page.drawText(introText, {
      x: marginX,
      y: cursorY,
      size: 9.5,
      font: fontRegular,
      maxWidth: width - marginX * 2,
      lineHeight: 14,
    });

    cursorY -= 34;

    // 4. DATA PEMOHON TABULAR
    const detailsLeft = marginX + 20;
    const colonX = marginX + 170;
    const valueX = colonX + 10;
    const rowHeight = 15;

    const dataRows = [
      ['Nama Lengkap', letter.applicantName],
      ['NIK', letter.applicantNik],
      ['Tempat / Tanggal Lahir', `${letter.birthPlace}, ${letter.birthDate}`],
      ['Jenis Kelamin', letter.gender],
      ['Agama', letter.religion],
      ['Status Perkawinan', letter.maritalStatus],
      ['Pekerjaan', letter.occupation],
      ['Alamat KTP / Domisili', letter.address],
    ];

    for (const [label, val] of dataRows) {
      page.drawText(label, {
        x: detailsLeft,
        y: cursorY,
        size: 9,
        font: fontRegular,
      });
      page.drawText(':', { x: colonX, y: cursorY, size: 9, font: fontRegular });
      page.drawText(String(val || '-'), {
        x: valueX,
        y: cursorY,
        size: 9,
        font: fontBold,
        maxWidth: width - valueX - marginX,
      });
      cursorY -= rowHeight;
    }

    cursorY -= 10;

    // 5. ISI KETERANGAN BERDASARKAN JENIS SURAT
    const details = (letter.details as Record<string, unknown> | null) || {};
    let contentParagraph = '';

    switch (letter.type) {
      case 'SKU':
        contentParagraph = `Adalah benar warga yang bersangkutan saat ini mempunyai dan menjalankan kegiatan usaha "${details.businessName || '-'}" yang bergerak di bidang ${details.businessType || '-'}. Usaha tersebut berlokasi di ${details.businessAddress || letter.address} dan telah berjalan sejak tahun ${details.startedYear || '-'}.\n\nSurat keterangan ini diberikan kepada yang bersangkutan untuk keperluan: ${details.purpose || 'Persyaratan administrasi perbankan/usaha'}.`;
        break;
      case 'SKTM':
        contentParagraph = `Adalah benar warga yang bertempat tinggal di Kelurahan Watundehoa dan berdasarkan catatan serta peninjauan di lapangan, keluarga yang bersangkutan benar tergolong dalam KELUARGA BERPENGHASILAN RENDAH / TIDAK MAMPU.\n\nSurat keterangan ini diberikan untuk keperluan: ${details.purpose || 'Keringanan biaya/pendidikan'}${details.familyMemberName ? ` atas nama: ${details.familyMemberName}` : ''}${details.schoolOrHospital ? ` di ${details.schoolOrHospital}` : ''}.`;
        break;
      case 'DOMISILI':
        contentParagraph = `Adalah benar yang bersangkutan secara faktual saat ini berdomisili dan bertempat tinggal di ${details.currentAddress || letter.address}, Kelurahan Watundehoa sejak ${details.residentSince || 'beberapa waktu yang lalu'} dengan status tempat tinggal ${details.residenceStatus || 'menetap'}.\n\nSurat keterangan ini diberikan untuk keperluan: ${details.purpose || 'Kelengkapan administrasi'}.`;
        break;
      case 'PENGANTAR_SKCK':
        contentParagraph = `Adalah benar yang bersangkutan merupakan warga Kelurahan Watundehoa yang berkelakuan baik di lingkungan masyarakat, tidak pernah terlibat tindak kriminalitas, serta tidak sedang tersangkut perkara hukum apa pun.\n\nSurat pengantar ini diberikan untuk keperluan pembuatan Surat Keterangan Catatan Kepolisian (SKCK) di ${details.targetOffice || 'Polsek Watunohu'} guna: ${details.purpose || 'Melamar pekerjaan'}.`;
        break;
      case 'BELUM_MENIKAH':
        contentParagraph = `Adalah benar bahwa yang bersangkutan sampai saat ini belum pernah melangsungkan perkawinan/pernikahan dengan siapapun, baik menurut hukum agama maupun hukum perkawinan negara Republik Indonesia, dan saat ini masih berstatus LAJANG / BELUM KAWIN.\n\nSurat keterangan ini dibuat untuk keperluan: ${details.purpose || 'Persyaratan administrasi'}.`;
        break;
      case 'BELUM_BEKERJA':
        contentParagraph = `Adalah benar bahwa yang bersangkutan dengan riwayat pendidikan terakhir ${details.lastEducation || '-'}, sampai saat surat keterangan ini dikeluarkan benar-benar BELUM / TIDAK MEMILIKI PEKERJAAN TETAP dan berstatus sebagai pencari kerja.\n\nSurat keterangan ini dibuat untuk keperluan: ${details.purpose || 'Kelengkapan berkas administrasi'}.`;
        break;
      case 'BELUM_MEMILIKI_RUMAH':
        contentParagraph = `Adalah benar bahwa yang bersangkutan sampai saat ini belum memiliki rumah tinggal sendiri / hak milik pribadi dan saat ini berstatus ${details.housingStatus || 'belum memiliki tempat tinggal tetap'}.\n\nSurat keterangan ini diberikan kepada yang bersangkutan untuk keperluan: ${details.purpose || 'Persyaratan pengajuan perumahan / KPR Bersubsidi'}.`;
        break;
      case 'PENGHASILAN':
        contentParagraph = `Adalah benar yang bersangkutan berprofesi di sektor informal sebagai ${details.sourceOfIncome || letter.occupation} dengan taksiran penghasilan rata-rata sebesar ${details.monthlyIncome || '-'} per bulan dan menanggung beban ${details.familyDependents || '-'} orang anggota keluarga.\n\nSurat keterangan ini dibuat untuk keperluan: ${details.purpose || 'Persyaratan administrasi'}.`;
        break;
      case 'PENGANTAR_NIKAH':
        contentParagraph = `Menerangkan bahwa yang bersangkutan memenuhi syarat untuk melangsungkan perkawinan dengan calon pasangan bernama ${details.spouseName || '-'} (Bin/Binti ${details.spouseFatherName || '-'}) yang beralamat di ${details.spouseAddress || '-'}, yang rencananya akan diselenggarakan di ${details.kuaTarget || 'KUA Watunohu'}.\n\nSurat pengantar Model N1 ini dibuat untuk proses pendaftaran pencatatan perkawinan resmi.`;
        break;
      case 'AHLI_WARIS':
        contentParagraph = `Menerangkan berdasarkan silsilah keluarga dan keterangan para saksi, yang bersangkutan adalah benar ahli waris yang sah dari Almarhum/Almarhumah ${details.deceasedName || '-'} yang meninggal dunia pada ${details.deceasedDate || '-'}.\n\nObjek keterangan waris/tanah: ${details.objectDescription || '-'}.\nSurat keterangan ini dibuat untuk keperluan: ${details.purpose || 'Administrasi pengurusan hak waris/tanah'}.`;
        break;
      case 'LAINNYA':
      default:
        contentParagraph = `Menerangkan perihal ${details.letterSubject || 'Keterangan Warga'}: ${details.explanation || 'Bahwa data yang bersangkutan telah terverifikasi secara sah pada catatan administrasi Kelurahan Watundehoa'}.\n\nSurat keterangan ini diberikan untuk keperluan: ${details.purpose || 'Kelengkapan berkas resmi'}.`;
        break;
    }

    const contentLines = contentParagraph
      .split('\n')
      .reduce((acc, paragraph) => {
        if (!paragraph.trim()) return acc + 1;
        const chars = paragraph.length;
        const wrapped = Math.max(1, Math.ceil(chars / 95));
        return acc + wrapped;
      }, 0);
    const contentBlockHeight = contentLines * 14;

    page.drawText(contentParagraph, {
      x: marginX,
      y: cursorY,
      size: 9.5,
      font: fontRegular,
      maxWidth: width - marginX * 2,
      lineHeight: 14,
    });

    cursorY -= contentBlockHeight + 14;

    // 6. PARAGRAF PENUTUP
    const closingText =
      'Demikian surat keterangan ini kami berikan kepada yang bersangkutan dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.';
    page.drawText(closingText, {
      x: marginX,
      y: cursorY,
      size: 9.5,
      font: fontRegular,
      maxWidth: width - marginX * 2,
      lineHeight: 14,
    });

    cursorY -= 20;

    // 7. AREA TANDA TANGAN ELEKTRONIK (TTE) DENGAN QR CODE RESMI
    const signDate = letter.signedAt ? new Date(letter.signedAt) : new Date();
    const formattedDate = signDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const signX = width - marginX - 180;
    page.drawText(`Watundehoa, ${formattedDate}`, {
      x: signX,
      y: cursorY,
      size: 9.5,
      font: fontRegular,
    });
    cursorY -= 14;
    page.drawText('Lurah Watundehoa,', {
      x: signX,
      y: cursorY,
      size: 9.5,
      font: fontBold,
    });

    cursorY -= 8;

    // Generate QR Code PNG Buffer pointing to public verification URL
    const publicVerifyUrl = `https://watundehoa.digital/verifikasi-surat/${letter.qrToken || letter.id}`;
    const qrPngBuffer = await QRCode.toBuffer(publicVerifyUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    const qrImage = await pdfDoc.embedPng(qrPngBuffer);

    // Draw QR Code Image
    const qrSize = 64;
    page.drawImage(qrImage, {
      x: signX + 10,
      y: cursorY - qrSize,
      width: qrSize,
      height: qrSize,
    });

    cursorY -= qrSize + 12;

    const signerName = letter.signedBy || 'H. AMIRUDDIN, S.Sos., M.Si.';
    page.drawText(signerName, {
      x: signX,
      y: cursorY,
      size: 9.5,
      font: fontBold,
    });
    const signerNameWidth = fontBold.widthOfTextAtSize(signerName, 9.5);
    page.drawLine({
      start: { x: signX, y: cursorY - 1 },
      end: { x: signX + signerNameWidth, y: cursorY - 1 },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });

    cursorY -= 12;
    page.drawText('NIP. 19780512 200604 1 008', {
      x: signX,
      y: cursorY,
      size: 8.5,
      font: fontRegular,
    });

    // 8. FOOTER RESMI DENGAN KETERANGAN TTE
    page.drawLine({
      start: { x: marginX, y: 44 },
      end: { x: width - marginX, y: 44 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText(
      'Dokumen ini sah & ditandatangani secara elektronik melalui KALOSARA (Kanal Layanan Online Surat & Administrasi Rakyat).',
      {
        x: marginX,
        y: 32,
        size: 7.5,
        font: fontOblique,
        color: rgb(0.4, 0.4, 0.4),
      },
    );
    page.drawText(
      `Pindai QR Code di atas atau buka ${publicVerifyUrl} untuk verifikasi keaslian dokumen.`,
      {
        x: marginX,
        y: 22,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.2, 0.5, 0.8),
      },
    );

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Save to shared uploads
    const uploadDir = this.getUploadDir();
    const lettersDir = path.join(uploadDir, 'letters');
    await fs.mkdir(lettersDir, { recursive: true });

    const safeTicket = letter.ticketNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTicket}.pdf`;
    const fullPath = path.join(lettersDir, filename);
    await fs.writeFile(fullPath, pdfBuffer);

    return {
      storagePath: `/uploads/letters/${filename}`,
      pdfBuffer,
    };
  }
}
