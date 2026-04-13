import { sendPdfReport } from "../lib/email/sendPdfReport";
import { transporter } from "../lib/email/nodemailerClient";

jest.mock("../lib/email/nodemailerClient", () => ({
  transporter: {
    sendMail: jest.fn(),
  },
}));

describe("sendPdfReport", () => {
  const mockPdfBuffer = Buffer.from("Fake PDF content");
  const baseMailData = {
    to: "test@example.com",
    subject: "Test PDF Report",
    pdfBuffer: mockPdfBuffer,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("✅ should send email with correct parameters", async () => {
    (transporter.sendMail as jest.Mock).mockResolvedValue({
      messageId: "12345",
    });

    const result = await sendPdfReport(baseMailData);

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: process.env.GMAIL_USER,
        to: baseMailData.to,
        subject: baseMailData.subject,
        attachments: [
          expect.objectContaining({
            filename: "reporte.pdf",
            content: mockPdfBuffer,
            contentType: "application/pdf",
          }),
        ],
      })
    );
    expect(result.success).toBe(true);
    expect(result.info).toEqual(expect.objectContaining({ messageId: "12345" }));
  });

  it("✅ should allow custom filename and from address", async () => {
    (transporter.sendMail as jest.Mock).mockResolvedValue({
      messageId: "abc123",
    });

    const result = await sendPdfReport({
      ...baseMailData,
      filename: "custom.pdf",
      from: "custom@example.com",
    });

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "custom@example.com",
        attachments: [
          expect.objectContaining({ filename: "custom.pdf" }),
        ],
      })
    );
    expect(result.success).toBe(true);
  });

  it("✅ should handle array of recipients", async () => {
    (transporter.sendMail as jest.Mock).mockResolvedValue({
      messageId: "multi123",
    });

    await sendPdfReport({
      ...baseMailData,
      to: ["a@example.com", "b@example.com"],
    });

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["a@example.com", "b@example.com"],
      })
    );
  });

  it("❌ should return error when sendMail throws", async () => {
    (transporter.sendMail as jest.Mock).mockRejectedValue(
      new Error("SMTP error")
    );

    const result = await sendPdfReport(baseMailData);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
