"use client";

export default function AppFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-6 text-center">
      <div className="container mx-auto px-4 md:px-8">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} AudioViz Studio. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
