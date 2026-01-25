'use client';

import Link from 'next/link';

interface BidLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    id: string;
}

export default function BidLink({ id, children, className, ...props }: BidLinkProps) {
    return (
        <Link
            href={`/book-index/${id}`}
            className={`text-vermilion hover:underline font-medium decoration-dotted underline-offset-4 ${className || ''}`}
            {...props}
        >
            {/* 
        Future extensibility:
        Add icon logic here based on 'id' type.
        e.g., const type = getTypeFromId(id);
      */}
            {children}
        </Link>
    );
}
