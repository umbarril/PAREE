import { use, type JSX } from "react";
import Base from "../components/Base";
import { useNavigate } from "react-router";
import { fetchBorrowedBooks } from "../services/LibraryService";
import { useAuthStore } from "../store/AuthStore";
import { useQuery } from "@tanstack/react-query";

export default function Library(): JSX.Element {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    const { data, error, isLoading } = useQuery({
        queryKey: ["borrowedBooks", user?.matricula],
        queryFn: fetchBorrowedBooks
    });

    return (
        <Base>

        </Base>
    );
}