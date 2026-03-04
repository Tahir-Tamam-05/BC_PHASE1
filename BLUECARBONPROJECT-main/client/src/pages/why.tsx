export default function Why() {
    return (
        <div className="min-h-screen bg-background text-foreground px-6 py-24">
            <div className="max-w-5xl mx-auto space-y-12">

                <h1 className="text-5xl font-bold text-center">
                    Why Nevara
                </h1>

                <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
                    Nevara simplifies environmental intelligence.
                    We transform complex geospatial data into clear, measurable impact.
                </p>

                <div className="grid md:grid-cols-3 gap-10 mt-16">

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Clarity</h3>
                        <p className="text-muted-foreground">
                            No technical noise. Just verified, understandable impact data.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Verification</h3>
                        <p className="text-muted-foreground">
                            Projects are backed by geospatial validation for real credibility.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Real Impact</h3>
                        <p className="text-muted-foreground">
                            Built for measurable coastal restoration outcomes.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}