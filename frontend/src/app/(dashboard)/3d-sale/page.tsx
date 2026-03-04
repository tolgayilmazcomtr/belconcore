import ThreeDViewer from './ThreeDViewer';

export default function ThreeDSalePage() {
    return (
        <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col relative bg-[#ECEEF2]">
            <ThreeDViewer />
        </div>
    );
}
