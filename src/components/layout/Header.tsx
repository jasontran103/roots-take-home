"use client";
import { Button } from '@/components/ui/button';
import { HeartIcon, UserIcon, HomeIcon } from 'lucide-react';

const Header = () => (
  <div className="bg-white border-b-4 border-neo-black py-4">
    <div className="mx-auto flex justify-between items-center px-4 ">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-neo-primary border-4 border-neo-black flex items-center justify-center mr-3">
          <HomeIcon className="h-6 w-6 text-neo-black" />
        </div>
        <div>
          <div className="text-2xl font-bold text-neo-black">Roots</div>
          <div className="text-sm text-neo-black">Find Your Next Home</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button className="neo-button-primary flex items-center [&>*:not(:last-child)]:mr-2">
          <HeartIcon className="h-4 w-4" />
          <span>Saved</span>
        </Button>
        <Button className="neo-button-primary flex items-center [&>*:not(:last-child)]:mr-2">
          <UserIcon className="h-4 w-4" />
          <span>Sign In</span>
        </Button>
      </div>
      <div className="sm:hidden">
        <Button className="neo-button-primary p-2 h-10 w-10">
          <UserIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>
);

export default Header; 