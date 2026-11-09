import nodemailer, { type Transporter } from "nodemailer";

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;
  private fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.fromAddress =
      process.env.SMTP_FROM ||
      '"KALOSARA Kelurahan Watundehoa" <noreply@watundehoa.digital>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.isConfigured = true;
    }
  }

  async sendRejectionEmail(params: {
    to: string;
    applicantName: string;
    ticketNumber: string;
    letterTitle: string;
    reason: string;
  }) {
    if (!this.isConfigured || !this.transporter) {
      console.warn(
        `[EmailService] SMTP not configured. Skipped sending rejection email to ${params.to} for ticket ${params.ticketNumber}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: params.to,
        subject: `[KALOSARA] Pemberitahuan Perbaikan Berkas - Tiket ${params.ticketNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #0369a1; margin: 0; font-size: 20px; font-weight: 800;">KALOSARA - KELURAHAN WATUNDEHOA</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Kanal Layanan Online Surat dan Administrasi Rakyat</p>
            </div>
            
            <p style="color: #334155; font-size: 14px;">Yth. Bapak/Ibu <strong>${params.applicantName}</strong>,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Permohonan surat Anda untuk <strong>${params.letterTitle}</strong> dengan Nomor Tiket: <strong style="font-family: monospace; color: #0284c7;">${params.ticketNumber}</strong> telah diperiksa oleh Admin Kelurahan.
            </p>

            <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #9f1239; font-size: 13px; font-weight: bold; margin: 0 0 6px;">Catatan / Alasan Perbaikan:</p>
              <p style="color: #881337; font-size: 13px; margin: 0; line-height: 1.5;">${params.reason}</p>
            </div>

            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Silakan login ke akun masyarakat Anda untuk mengunggah berkas perbaikan tanpa harus mengisi formulir dari awal:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="https://watundehoa.digital/masyarakat/dashboard" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: bold; border-radius: 8px;">
                Buka Dashboard & Perbaiki Berkas
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
              Pesan ini dikirim secara otomatis oleh Sistem KALOSARA Kelurahan Watundehoa, Kec. Watunohu, Kab. Kolaka Utara.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[EmailService] Failed to send rejection email:", err);
    }
  }

  async sendCompletionEmail(params: {
    to: string;
    applicantName: string;
    ticketNumber: string;
    letterNumber: string;
    letterTitle: string;
    downloadUrl: string;
    qrVerifyUrl: string;
  }) {
    if (!this.isConfigured || !this.transporter) {
      console.warn(
        `[EmailService] SMTP not configured. Skipped sending completion email to ${params.to} for ticket ${params.ticketNumber}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: params.to,
        subject: `[KALOSARA] Surat Selesai Ditandatangani - ${params.letterNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #0369a1; margin: 0; font-size: 20px; font-weight: 800;">KALOSARA - KELURAHAN WATUNDEHOA</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Kanal Layanan Online Surat dan Administrasi Rakyat</p>
            </div>
            
            <p style="color: #334155; font-size: 14px;">Yth. Bapak/Ibu <strong>${params.applicantName}</strong>,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Kabar baik! Permohonan surat Anda untuk <strong>${params.letterTitle}</strong> telah disetujui dan <strong>ditandatangani secara elektronik (TTE)</strong> oleh Lurah Watundehoa.
            </p>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #166534; font-size: 13px; font-weight: bold; margin: 0 0 4px;">Informasi Dokumen:</p>
              <p style="color: #14532d; font-size: 12px; margin: 2px 0;">Nomor Tiket: <strong>${params.ticketNumber}</strong></p>
              <p style="color: #14532d; font-size: 12px; margin: 2px 0;">Nomor Surat Resmi: <strong style="font-family: monospace;">${params.letterNumber}</strong></p>
              <p style="color: #14532d; font-size: 12px; margin: 2px 0;">Status: <strong>Telah Ditandatangani Elektronik (QR Code Resmi Aktif)</strong></p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${params.downloadUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: bold; border-radius: 8px; margin-right: 8px;">
                Unduh PDF Surat Resmi
              </a>
              <a href="${params.qrVerifyUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 20px; font-size: 13px; font-weight: bold; border-radius: 8px;">
                Cek Verifikasi Keaslian
              </a>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              Surat resmi ini sah dan berkekuatan hukum dengan verifikasi QR Code elektronik. Anda dapat mencetaknya langsung atau menyimpannya dalam bentuk file digital.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
              Pesan ini dikirim secara otomatis oleh Sistem KALOSARA Kelurahan Watundehoa, Kec. Watunohu, Kab. Kolaka Utara.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[EmailService] Failed to send completion email:", err);
    }
  }
}
