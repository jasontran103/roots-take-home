"use client";
import { Button } from '@/components/ui/button';
import { HeartIcon, UserIcon, HomeIcon } from 'lucide-react';

const Header = () => (
  <header className="text-neo-black border-b-8 border-black py-4">
    <div className="neo-container mx-auto flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-neo-primary border-4 border-neo-black flex items-center justify-center mr-3">
          <HomeIcon className="h-6 w-6 text-neo-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roots</h1>
          <p className="text-sm">Find Your Next Home</p>
        </div>
      </div>
      <div className="hidden sm:flex gap-3 items-center space-x-3">
        <Button className="neo-button-primary flex items-center gap-2">
          <HeartIcon className="h-4 w-4" />
          <span>Saved</span>
        </Button>
        <Button className="neo-button-primary">
          <UserIcon className="h-4 w-4 mr-2" />
          <span>Sign In</span>
        </Button>
      </div>
      <div className="sm:hidden">
        <Button className="neo-button-primary p-2 h-10 w-10">
          <UserIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </header>
);

export default Header; 