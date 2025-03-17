import React from 'react';
import Image from "next/image";

const Logo = () => {
    return (
        <div className='w-12 ml-1.5'>
            <Image
                className="dark:invert"
                src="/whale4.svg"
                alt="dw chat logo"
                width={38}
                height={38}
                priority
            />
        </div>
    );
};

export default Logo;