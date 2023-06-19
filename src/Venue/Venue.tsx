import { useParams } from "react-router-dom";
import {
  Box,
  Center,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Button,
  HStack,
  VStack,
  Input,
  useBoolean,
  CloseButton,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import { getVenues } from "../mock-data/venues";
import { useMemo, useState, useEffect } from "react";
import { NumberParam, useQueryParams } from "use-query-params";
import { getEventTypes } from "../utils";

function readableMinutesTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours ? `${hours}h ` : ""}${minutes ? `${minutes}m` : ""}`;
}

function getStepOption(
  stepSize: number,
  stepsCount: number,
  index: number
): { value: number; label: string } {
  const value = (index - stepsCount) * stepSize;
  const label =
    value === 0
      ? "at the event start"
      : `${readableMinutesTime(Math.abs(value))}  ${
          value > 0 ? "after" : "before"
        }`;

  return { value: value * 60000, label };
}

function WithLeadingZero(value: number) {
  return value < 10 ? `0${value}` : value;
}

function getDateInputString(date = new Date()) {
  return `${date.getFullYear()}-${WithLeadingZero(
    date.getMonth() + 1
  )}-${WithLeadingZero(date.getDate())}T${WithLeadingZero(
    date.getHours()
  )}:${WithLeadingZero(date.getMinutes())}`;
}

function EventConfig({
  stepSize = 15,
  stepsCount = 4,
  occupancySteps = 10,
  max_capacity = 10000,
}: {
  stepSize?: number;
  stepsCount?: number;
  occupancySteps?: number;
  max_capacity?: number;
}) {
  const [query, setQuery] = useQueryParams({
    eventTime: NumberParam,
    offset: NumberParam,
    occupancy: NumberParam,
    eventType: NumberParam,
  });
  const { eventTime, offset, occupancy, eventType } = query;

  const { data: eventTypes } = useQuery({
    queryKey: ["eventTypes"],
    queryFn: getEventTypes,
  });
  const eventTypesOptions = useMemo(
    () => eventTypes?.map(({ id, name }) => ({ value: id, label: name })),
    [eventTypes]
  );

  const [selectedEventType, setSelectedEventType] = useState<
    { value: number; label: string } | undefined
  >();
  if (eventTypesOptions && !selectedEventType) {
    setSelectedEventType(
      eventTypesOptions.find(({ value }) => value === eventType) ??
        eventTypesOptions[0]
    );
  }
  useEffect(() => {
    if (selectedEventType) {
      setQuery((prev) => ({ ...prev, eventType: selectedEventType.value }));
    }
  }, [selectedEventType, setQuery]);

  const timeOptions = useMemo(
    () =>
      Array.from({ length: stepsCount * 2 + 1 }).map((_, i) =>
        getStepOption(stepSize, stepsCount, i)
      ),
    [stepSize, stepsCount]
  );
  const occupancyOptions = useMemo(
    () =>
      Array.from({ length: occupancySteps }, (_, idx) => ({
        label: `${Math.round(
          (100 * (idx + 1)) / occupancySteps
        )}% [${Math.round((max_capacity * (idx + 1)) / occupancySteps)}]`,
        value: Math.round((max_capacity * (idx + 1)) / occupancySteps),
      })),
    [max_capacity, occupancySteps]
  );

  const [selectedTimeOffset, setSelectedTimeOffset] = useState<{
    value: number;
    label: string;
  }>(
    timeOptions.find(({ value }) => value === offset) ?? timeOptions[stepsCount]
  );

  const [selectedOccupancy, setSelectedOccupancy] = useState<{
    value: number;
    label: string;
  }>(
    occupancyOptions.find(({ value }) => value === occupancy) ??
      occupancyOptions[0]
  );
  if (selectedOccupancy?.value !== occupancy) {
    setQuery((prev) => ({ ...prev, occupancy: selectedOccupancy.value }));
  }

  if (!eventTime) {
    setQuery((prev) => ({
      ...prev,
      eventTime: Date.now() + 24 * 60 * 60 * 1000,
    }));
  }

  const offsetMS = selectedTimeOffset.value;
  useEffect(() => {
    setQuery((prev) => ({ ...prev, offset: offsetMS }));
  }, [offsetMS, setQuery]);

  return (
    <VStack align="start">
      <Input
        type="datetime-local"
        value={getDateInputString(
          new Date(eventTime ?? Date.now() + 24 * 60 * 60 * 1000)
        )}
        onChange={(e) => {
          setQuery((prev) => ({
            ...prev,
            eventTime: new Date(e.target.value).getTime(),
          }));
        }}
        min={getDateInputString(new Date(Date.now() + 24 * 60 * 60 * 1000))}
      />
      <Box as="label" display="block" mt={4}>
        Event type:
        <Box mt={2} mb={6}>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              {selectedEventType?.label}
            </MenuButton>
            <MenuList>
              {eventTypesOptions?.map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.value}
                  onClick={() => {
                    setSelectedEventType(item);
                  }}
                  _selected={{ bg: "blue.500", color: "white" }}
                  aria-selected={item === selectedEventType ? true : undefined}
                >
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>
      </Box>
      <Box as="label" display="block" mt={4}>
        Occupancy (max: {max_capacity}):
        <Box mt={2} mb={6}>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              {selectedOccupancy.label}
            </MenuButton>
            <MenuList>
              {occupancyOptions.map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.value}
                  onClick={() => {
                    setQuery((prev) => ({ ...prev, occupancy: item.value }));
                    setSelectedOccupancy(item);
                  }}
                  _selected={{ bg: "blue.500", color: "white" }}
                  aria-selected={item === selectedOccupancy ? true : undefined}
                >
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>
      </Box>
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
          {selectedTimeOffset.label}
        </MenuButton>
        <MenuList>
          {timeOptions.map((item) => (
            <MenuItem
              key={item.value}
              value={item.value}
              onClick={() => setSelectedTimeOffset(item)}
              _selected={{ bg: "blue.500", color: "white" }}
              aria-selected={item === selectedTimeOffset ? true : undefined}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </VStack>
  );
}

export function Venue() {
  const { id } = useParams();
  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: getVenues,
  });
  const [isOpen, setIsOpen] = useBoolean(false);

  const selectedVenue = venues?.features.find(
    ({ id: currentId }) => currentId?.toString() === id
  );

  if (!selectedVenue) {
    return (
      <Center flex="0 0 auto" py={2} w="full">
        Loading...
      </Center>
    );
  }

  return (
    <>
      <Center onClick={setIsOpen.toggle} flex="0 0 auto" py={2} w="full">
        {selectedVenue?.properties?.name}
      </Center>
      <VStack
        position="fixed"
        top={0}
        bottom={0}
        right={0}
        transform={isOpen ? "" : "translateX(100%)"}
        transition="transform 0.3s ease-in-out"
        width="xs"
        zIndex={1}
        align="start"
        bg="gray.700"
        p={4}
        spacing={4}
      >
        <HStack justifyContent="space-between" w="full">
          <Box
            fontSize="lg"
            fontWeight="bold"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {selectedVenue?.properties?.name}
          </Box>
          <CloseButton onClick={setIsOpen.off} />
        </HStack>
        <Box>{selectedVenue?.properties?.description}</Box>
        <EventConfig
          stepSize={15}
          stepsCount={8}
          max_capacity={selectedVenue?.properties?.max_capacity}
        />
      </VStack>
    </>
  );
}
