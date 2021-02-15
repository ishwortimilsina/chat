import { useState } from "react";

export function SearchContacts({ searchTerm, setSearchTerm }) {
    return (
        <input
            type="text"
            className="search-input"
            placeholder="Search Contact"
            value={searchTerm}
            onChange={({ target }) => setSearchTerm(target.value)}
        />
    );
}