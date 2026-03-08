export const generateQRCodeURL = (data: string): string => {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
};

export const generateBarcodeURL = (data: string, format: string = 'code128'): string => {
  const encoded = encodeURIComponent(data);
  return `https://bwipjs-api.metafloor.com/?bcid=${format}&text=${encoded}&scale=3`;
};

export const generateEmployeeQR = (employeeId: string, employeeName: string): string => {
  const data = JSON.stringify({
    type: 'employee',
    id: employeeId,
    name: employeeName,
    timestamp: Date.now(),
  });
  return generateQRCodeURL(data);
};

export const generateProductQR = (productId: string, sku: string, name: string): string => {
  const data = JSON.stringify({
    type: 'product',
    id: productId,
    sku,
    name,
  });
  return generateQRCodeURL(data);
};

export const generateAssetQR = (assetId: string, serialNumber: string): string => {
  const data = JSON.stringify({
    type: 'asset',
    id: assetId,
    serialNumber,
  });
  return generateQRCodeURL(data);
};
