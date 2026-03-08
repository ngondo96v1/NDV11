
export const compressImage = (base64Str: string, maxWidth = 600, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const calculateFine = (amount: number, dueDateStr: string): number => {
  const [d, m, y] = dueDateStr.split('/').map(Number);
  const dueDate = new Date(y, m - 1, d);
  const today = new Date();
  
  // Set time to midnight for accurate day comparison
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  if (today <= dueDate) return 0;
  
  const diffTime = Math.abs(today.getTime() - dueDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 0;

  const fineRate = 0.001; // 0.1% per day
  let fine = amount * fineRate * diffDays;
  
  const maxFine = amount * 0.3; // 30% cap
  return Math.round(Math.min(fine, maxFine));
};

/**
 * Sinh mã hợp đồng duy nhất
 * Định dạng: NDV-[YYYYMMDD]-[4 ký tự cuối UID]-[4 số ngẫu nhiên]
 */
export const generateContractId = (userId: string): string => {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
  const userPart = userId.slice(-4).toUpperCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `NDV-${datePart}-${userPart}-${randomPart}`;
};
