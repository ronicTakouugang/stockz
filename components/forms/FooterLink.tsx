import Link from "next/link";

// Définition du type pour les props
interface FooterLinkerProps {
    text: string;
    linkText: string;
    href: string;
}

const FooterLink = ({ text, linkText, href }: FooterLinkerProps) => {
    return (
        <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
                {text}{' '}
                <Link href={href} className="footer-link">
                    {linkText}
                </Link>
            </p>
        </div>
    );
};

export default FooterLink;