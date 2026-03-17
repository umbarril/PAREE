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

export const generateColorFromPallete = (seed: string): string => {
  const palette = [
    "#E57373", // Red
    "#F06292", // Pink
    "#BA68C8", // Purple
    "#9575CD", // Deep Purple
    "#7986CB", // Indigo
    "#64B5F6", // Blue
    "#4FC3F7", // Light Blue
  ]
  // https://color.adobe.com/create/color-wheel
  const palette2 = [ // todo
    "#E04131",
    "#4338E0",
    "#E0C638",
    "#38E083",
    "#A19450",
    "#8B5651",
    "#55518B",
    "#518B6B",
    "#615D49",
    "#423938"
  ]
  const index = Math.abs(seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % palette2.length;

  return palette2[index];
}