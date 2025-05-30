import * as React from 'react';
import Image, { type ImageProps as NextImageProps } from 'next/image';
import { useTheme } from 'next-themes';

// Importe corretamente os logos
import logoLightFile from '@/assets/logo.png'; // Logo para o modo claro

// O usuário deverá criar o arquivo src/assets/logonoturno.png para o modo escuro.
// Por enquanto, usaremos o logo claro como placeholder para o logo escuro
// para evitar erros de build. O usuário precisará atualizar o import abaixo:
// import logoDarkFile from '@/assets/logonoturno.png';
import logoDarkFile from '@/assets/logoescuro.png'; // 

interface LogoProps extends Omit<NextImageProps, 'src' | 'alt'> {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({
  className,
  width = 150, // Default width, conforme estrutura anterior
  height = 50,  // Default height, conforme estrutura anterior
  ...props
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determina qual logo usar com base no tema resolvido.
  // Antes de o componente ser montado no cliente, ou se o tema não for 'dark', usa o logo claro.
  const currentLogoSrc = (mounted && resolvedTheme === 'dark') ? logoDarkFile : logoLightFile;
  
  // Para o alt text, podemos também diferenciar se desejado, ou manter genérico.
  // Mantendo genérico por simplicidade, a menos que os logos sejam drasticamente diferentes em conteúdo.
  const altText = "GPAC Agenda Logo";

  // Para evitar hydration mismatch, é importante que o SSR e o primeiro render no cliente sejam consistentes.
  // Se !mounted, renderizamos o logo claro, que será o mesmo no SSR.
  const imageSrcToRender = !mounted ? logoLightFile : currentLogoSrc;

  return (
    <Image
      src={imageSrcToRender}
      alt={altText}
      width={width}
      height={height}
      className={className}
      priority // Logo é geralmente um elemento prioritário (LCP)
      {...props}
    />
  );
}
