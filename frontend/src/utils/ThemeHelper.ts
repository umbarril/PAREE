// todo escolher um melhor nome para o arquivo

// gera uma cor vibrante baseada em uma string de entrada
// todo: melhorar essa função para gerar cores mais variadas
// todo: ter certeza de que o texto é legível sobre a cor de fundo gerada
export const generateVibrantColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to get a Hue between 0 and 360
  const hue = Math.abs(hash % 360);
  // Return HSL string (70% saturation, 50% lightness for balanced colors)
  return `hsl(${hue}, 70%, 50%)`;
};