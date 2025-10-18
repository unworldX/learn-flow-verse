import { useState } from 'react';
import { BookOpen } from 'lucide-react';

type Props = {
    className?: string;
    alt?: string;
};

export function BrandLogo({ className = 'w-20 h-20', alt = 'App logo' }: Props) {
    const [failed, setFailed] = useState(false);

    if (!failed) {
        return (
            <img
                src="./logo.png"
                alt={alt}
                className={className + ' object-contain rounded-xl'}
                onError={() => setFailed(true)}
                loading="eager"
                decoding="sync"
            />
        );
    }
    // Fallback to previous icon style
    return (
        <div className={`inline-flex items-center justify-center bg-gradient-primary rounded-2xl ${className}`}>
            <BookOpen className="w-1/2 h-1/2 text-primary-foreground" />
        </div>
    );
}

export default BrandLogo;
