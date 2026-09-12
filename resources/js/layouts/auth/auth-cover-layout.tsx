import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthCoverLayout({ children }: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <Link
                        href={home()}
                        className="flex items-center gap-2 font-medium"
                    >
                        <AppLogoIcon className="size-9 fill-current text-foreground" />
                        Sewa Alat Camping
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">{children}</div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <img
                    src="/images/orange-tent.webp"
                    alt="Illuminated camping tents on a grassy field at night under a starry sky with the Milky Way visible."
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8]"
                />
            </div>
        </div>
    );
}