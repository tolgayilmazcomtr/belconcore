import PresentationViewer from './PresentationViewer';

export default function PresentationPage() {
    return (
        <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col relative bg-[#ECEEF2]">
            <PresentationViewer />
        </div>
    );
}
