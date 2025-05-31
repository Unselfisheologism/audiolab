
"use client";

export default function AppFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-6 text-center mt-auto">
      {/* This footer is now part of the AudioVizStudioPage content. 
          audiolab might have its own global footer. */}
      <div className="container mx-auto px-4 md:px-8">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} AudioViz Studio Feature.
        </p>
      </div>
    </footer>
  );
}
