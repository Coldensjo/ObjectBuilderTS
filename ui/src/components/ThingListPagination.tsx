import React, { useState, useEffect } from 'react';
import './ThingListPagination.css';

interface ThingListPaginationProps {
	pagination: {
		totalCount: number;
		minId: number;
		maxId: number;
		currentMin: number;
		currentMax: number;
	} | null;
	onNavigate: (targetId: number) => void;
	disabled?: boolean;
}

export const ThingListPagination: React.FC<ThingListPaginationProps> = ({
	pagination,
	onNavigate,
	disabled = false,
}) => {
	const [inputValue, setInputValue] = useState<string>('');

	useEffect(() => {
		if (pagination) {
			// Set input to current min ID
			setInputValue(pagination.currentMin.toString());
		} else {
			setInputValue('');
		}
	}, [pagination]);

	if (!pagination) {
		return null;
	}

	const canGoPrevious = pagination.currentMin > pagination.minId;
	const canGoNext = pagination.currentMax < pagination.maxId;
	const pageSize = pagination.currentMax - pagination.currentMin + 1;

	const goToFirst = () => {
		if (!disabled && canGoPrevious) {
			onNavigate(pagination.minId);
		}
	};

	const goToPrevious = () => {
		if (!disabled && canGoPrevious) {
			// Calculate previous page targetId
			const previousMin = Math.max(pagination.minId, pagination.currentMin - pageSize);
			onNavigate(previousMin);
		}
	};

	const goToNext = () => {
		if (!disabled && canGoNext) {
			// Calculate next page targetId
			const nextMin = Math.min(pagination.maxId, pagination.currentMax + 1);
			onNavigate(nextMin);
		}
	};

	const goToLast = () => {
		if (!disabled && canGoNext) {
			// Calculate last page targetId
			const lastPageMin = Math.max(pagination.minId, pagination.maxId - pageSize + 1);
			onNavigate(lastPageMin);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleInputSubmit();
		}
	};

	const handleInputSubmit = () => {
		const value = parseInt(inputValue, 10);
		if (!isNaN(value) && value >= pagination.minId && value <= pagination.maxId) {
			onNavigate(value);
		} else {
			// Reset to current value if invalid
			setInputValue(pagination.currentMin.toString());
		}
	};

	const handleIncrement = () => {
		if (!disabled) {
			const newValue = Math.min(pagination.maxId, pagination.currentMin + 1);
			onNavigate(newValue);
		}
	};

	const handleDecrement = () => {
		if (!disabled) {
			const newValue = Math.max(pagination.minId, pagination.currentMin - 1);
			onNavigate(newValue);
		}
	};

	return (
		<div className="thing-list-pagination" title="ThingListPagination component">
			<button
				className="thing-list-pagination-button"
				onClick={goToFirst}
				disabled={disabled || !canGoPrevious}
				title="thing-list-pagination-button (First page)"
			>
				««
			</button>
			<button
				className="thing-list-pagination-button"
				onClick={goToPrevious}
				disabled={disabled || !canGoPrevious}
				title={`thing-list-pagination-button (Previous ${pageSize} items)`}
			>
				«
			</button>
			<button
				className="thing-list-pagination-button"
				onClick={handleDecrement}
				disabled={disabled || pagination.currentMin <= pagination.minId}
				title="thing-list-pagination-button (Previous item)"
			>
				‹
			</button>
			<input
				type="text"
				className="thing-list-pagination-input"
				value={inputValue}
				onChange={handleInputChange}
				onKeyDown={handleInputKeyDown}
				onBlur={handleInputSubmit}
				disabled={disabled}
				title={`thing-list-pagination-input (Enter ID ${pagination.minId}-${pagination.maxId})`}
			/>
			<button
				className="thing-list-pagination-button"
				onClick={handleIncrement}
				disabled={disabled || pagination.currentMin >= pagination.maxId}
				title="thing-list-pagination-button (Next item)"
			>
				›
			</button>
			<button
				className="thing-list-pagination-button"
				onClick={goToNext}
				disabled={disabled || !canGoNext}
				title={`thing-list-pagination-button (Next ${pageSize} items)`}
			>
				»
			</button>
			<button
				className="thing-list-pagination-button"
				onClick={goToLast}
				disabled={disabled || !canGoNext}
				title="thing-list-pagination-button (Last page)"
			>
				»»
			</button>
		</div>
	);
};

