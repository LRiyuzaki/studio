'use client';

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 256 256">
      <path fill="#a8b0bd" d="M248 80H88a8 8 0 0 0-8 8v88a8 8 0 0 0 16 0V96h152a8 8 0 0 0 0-16Z"/>
      <path fill="#d1d7e0" d="M208 48H56a8 8 0 0 0-8 8v144a8 8 0 0 0 16 0V64h144a8 8 0 0 0 0-16Z"/>
      <path fill="currentColor" d="M168 16H32a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h136a16 16 0 0 0 16-16V32a16 16 0 0 0-16-16Zm-8 184H40V40h120v160Z" className="text-blue-600"/>
    </svg>
  );

export default function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-pulse">
        <BookIcon />
      </div>
    </div>
  );
}
