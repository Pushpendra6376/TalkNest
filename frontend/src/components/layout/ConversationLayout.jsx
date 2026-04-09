import { Outlet, useParams } from "react-router-dom"
import ConversationsList from "../dashboard/ConversationsList"

const ConversationLayout = () => {
    // mobile vs desktop layout handling
    const { id } = useParams()

    return (
        <div className="h-full w-full flex overflow-hidden">
            {/* Conversations list */}
            <div
                className={[
                    "h-full shrink-0 border-r overflow-hidden",
                    "lg:flex lg:flex-col lg:w-96",
                    id ? "hidden" : "flex flex-col w-full",
                ].join(" ")}
            >
                <ConversationsList />
            </div>

            {/* Chat detail */}
            <div
                className={[
                    "flex flex-1 flex-col min-h-0 overflow-hidden",
                    id ? "flex" : "hidden lg:flex",
                ].join(" ")}
            >
                <Outlet />
            </div>
        </div>
    )
}

export default ConversationLayout