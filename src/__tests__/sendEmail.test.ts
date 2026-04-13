import { sendEmail } from '../lib/email/sendEmail';
import { transporter } from '../lib/email/nodemailerClient';

// 🔹 Mock del transporter
jest.mock('../lib/email/nodemailerClient', () => ({
  transporter: {
    sendMail: jest.fn(),
  },
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});


describe('sendEmail', () => {
  const mockSendMail = transporter.sendMail as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería enviar un email correctamente (to como string)', async () => {
    // Arrange
    const mockInfo = { messageId: '123abc' };
    mockSendMail.mockResolvedValueOnce(mockInfo);

    // Act
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Hola',
      text: 'Mensaje de prueba',
    });

    // Assert
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: process.env.GMAIL_USER,
      to: 'test@example.com',
      subject: 'Hola',
      text: 'Mensaje de prueba',
    });

    expect(result).toEqual({ success: true, info: mockInfo });
  });

  it('debería enviar un email correctamente (to como array)', async () => {
    const mockInfo = { messageId: '456def' };
    mockSendMail.mockResolvedValueOnce(mockInfo);

    const result = await sendEmail({
      to: ['uno@example.com', 'dos@example.com'],
      subject: 'Hola a todos',
      text: 'Mensaje grupal',
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: process.env.GMAIL_USER,
      to: 'uno@example.com, dos@example.com',
      subject: 'Hola a todos',
      text: 'Mensaje grupal',
    });

    expect(result.success).toBe(true);
  });

  it('debería manejar errores correctamente', async () => {
    const mockError = new Error('Fallo al enviar');
    mockSendMail.mockRejectedValueOnce(mockError);

    const result = await sendEmail({
      to: 'fail@example.com',
      subject: 'Error',
      text: 'Esto fallará',
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.error).toBe(mockError);
  });

  it('debería usar el parámetro "from" personalizado si se proporciona', async () => {
    const mockInfo = { messageId: 'custom-from' };
    mockSendMail.mockResolvedValueOnce(mockInfo);

    await sendEmail({
      to: 'dest@example.com',
      subject: 'Con remitente personalizado',
      text: 'Hola',
      from: 'otro@example.com',
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'otro@example.com',
      to: 'dest@example.com',
      subject: 'Con remitente personalizado',
      text: 'Hola',
    });
  });
});
